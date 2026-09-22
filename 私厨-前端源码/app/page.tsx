"use client";

import {useState, useEffect, useRef} from "react";
import {Message, SessionInfo} from "@/types/chat";
import {ChatMessage} from "@/components/ChatMessage";
import {ChatInput} from "@/components/ChatInput";
import {SessionSidebar} from "@/components/SessionSidebar";
import {uploadImageToOss, streamChat, getChatHistory, clearChatHistory, listThreads} from "@/lib/api";
import {generateUUID} from "@/lib/utils";
import {UtensilsCrossed, ChefHat} from "lucide-react";

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [processing, setProcessing] = useState(false);
    const [threadId, setThreadId] = useState<string>("");
    const [notice, setNotice] = useState<string>("");
    // 侧边栏收起状态（localStorage 持久化）
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
        () => typeof window !== "undefined" && localStorage.getItem("sidebar_collapsed") === "1"
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);
    const noticeTimer = useRef<number | undefined>(undefined);

    // 显示临时提示（2.5秒后自动消失）
    const showNotice = (text: string) => {
        setNotice(text);
        window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => setNotice(""), 2500);
    };

    // 加载历史消息，返回加载条数（-1 表示失败）
    const loadHistory = async (id: string): Promise<number> => {
        try {
            const history = await getChatHistory(id);
            if (history && history.length > 0) {
                const loadedMessages: Message[] = history.map((msg, index) => {
                    // 处理多模态消息
                    let content = "";
                    let imageUrl: string | undefined;

                    if (typeof msg.content === 'string') {
                        content = msg.content;
                    } else if (Array.isArray(msg.content)) {
                        // 提取文本和图片
                        const parts = msg.content as { type: string; text?: string; url?: string }[];
                        for (const part of parts) {
                            if (part.type === 'text' && part.text) {
                                content += part.text;
                            } else if (part.type === 'image' && part.url) {
                                imageUrl = part.url;
                            }
                        }
                    }

                    return {
                        id: `history_${index}_${Date.now()}`,
                        role: msg.role as "user" | "assistant",
                        content,
                        imageUrl,
                        timestamp: Date.now() - (history.length - index) * 1000,
                    };
                });
                setMessages(loadedMessages);
                messageIdCounter.current = loadedMessages.length;
                return loadedMessages.length;
            } else {
                // 历史为空时同步清空界面，保证按钮刷新后的状态与服务端一致
                setMessages([]);
                messageIdCounter.current = 0;
                return 0;
            }
        } catch (error) {
            console.error("加载历史消息失败:", error);
            return -1;
        }
    };

    // 刷新会话列表
    const refreshSessions = async (): Promise<SessionInfo[]> => {
        try {
            const list = await listThreads();
            setSessions(list);
            return list;
        } catch (error) {
            console.error("获取会话列表失败:", error);
            return [];
        }
    };

    // 页面加载时恢复上次会话并拉取会话列表
    useEffect(() => {
        const init = async () => {
            let storedThreadId = localStorage.getItem("thread_id") || "";
            const list = await refreshSessions();
            if (!storedThreadId) {
                // 无本地记录：优先进入最近的历史会话，否则生成新会话
                storedThreadId = list[0]?.thread_id || generateUUID();
                localStorage.setItem("thread_id", storedThreadId);
            }
            setThreadId(storedThreadId);
            loadHistory(storedThreadId);
        };
        init();
    }, []);

    // 切换侧边栏收起/展开
    const handleToggleSidebar = () => {
        setSidebarCollapsed((prev) => {
            localStorage.setItem("sidebar_collapsed", prev ? "0" : "1");
            return !prev;
        });
    };

    // 新建会话（保留历史会话，仅切换到新的空白会话）
    const handleNewChat = () => {
        if (processing) return;
        const newThreadId = generateUUID();
        localStorage.setItem("thread_id", newThreadId);
        setThreadId(newThreadId);
        setMessages([]);
        messageIdCounter.current = 0;
    };

    // 切换会话
    const handleSelectSession = (sessionId: string) => {
        if (sessionId === threadId || processing) return;
        localStorage.setItem("thread_id", sessionId);
        setThreadId(sessionId);
        setMessages([]);
        messageIdCounter.current = 0;
        loadHistory(sessionId);
    };

    // 删除会话
    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm("确定删除该会话吗？删除后不可恢复。")) return;
        try {
            await clearChatHistory(sessionId);
            const list = await refreshSessions();
            showNotice("已删除该会话");
            // 删除的是当前会话时，切换到最近的会话或新建空白会话
            if (sessionId === threadId) {
                const nextId = list[0]?.thread_id || generateUUID();
                localStorage.setItem("thread_id", nextId);
                setThreadId(nextId);
                setMessages([]);
                messageIdCounter.current = 0;
                loadHistory(nextId);
            }
        } catch (error) {
            console.error("删除会话失败:", error);
            showNotice("删除会话失败，请稍后重试");
        }
    };

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // 添加消息
    const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
        messageIdCounter.current += 1;
        const newMessage: Message = {
            ...message,
            id: `msg_${messageIdCounter.current}_${Date.now()}`,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
    };

    // 处理发送消息
    const handleSend = async (text: string, file?: File) => {
        if (processing) return;

        let imageUrl: string | undefined;

        // 如果有图片，先上传到 OSS
        if (file) {
            try {
                imageUrl = await uploadImageToOss(file);
            } catch (error) {
                console.error("图片上传失败:", error);
                addMessage({
                    role: "assistant",
                    content: "图片上传失败，请稍后重试。",
                });
                return;
            }
        }

        // 添加用户消息
        addMessage({
            role: "user",
            content: text || "上传了一张食材图片",
            imageUrl,
        });

        setProcessing(true);

        // 添加助手消息（流式输出）
        const assistantMessageId = addMessage({
            role: "assistant",
            content: "",
            streaming: true,
        }).id;

        try {
            await streamChat(
                text || "这是我冰箱里的食物，帮我看看能做什么佳肴？",
                (chunk) => {
                    // 更新消息内容
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {...msg, content: msg.content + chunk}
                                : msg
                        )
                    );
                }, imageUrl,
                (error) => {
                    console.error("聊天失败:", error);
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {
                                    ...msg,
                                    content: msg.content + `\n[错误]: ${error.message}`,
                                    streaming: false,
                                }
                                : msg
                        )
                    );
                },
                () => {
                    // 流式输出完成，刷新侧边栏会话列表（新会话产生标题）
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === assistantMessageId
                                ? {...msg, streaming: false}
                                : msg
                        )
                    );
                    refreshSessions();
                },
                threadId
            );
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#faf9f7]">
            {/* 临时提示 */}
            {notice && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-gray-900/80 text-white text-sm rounded-full shadow-lg">
                    {notice}
                </div>
            )}

            {/* 顶部标题栏 */}
            <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center px-5 gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
                    <ChefHat className="text-white" size={22}/>
                </div>
                <div>
                    <h1 className="text-base font-bold text-gray-900 leading-tight">AI 私人厨师</h1>
                    <p className="text-xs text-gray-400">上传食材图片，获取个性化食谱推荐</p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* 左侧会话侧边栏 */}
                <SessionSidebar
                    sessions={sessions}
                    activeSessionId={threadId}
                    collapsed={sidebarCollapsed}
                    onNewChat={handleNewChat}
                    onSelect={handleSelectSession}
                    onDelete={handleDeleteSession}
                    onToggle={handleToggleSidebar}
                />

                {/* 主聊天区域 */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto py-6">
                        {/* 消息列表通栏展示：AI 消息靠近左侧，用户消息靠近右侧 */}
                        <div className="w-full px-8 min-h-full flex flex-col">
                            {messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                        <UtensilsCrossed size={44} className="text-orange-400"/>
                                    </div>
                                    <p className="text-lg font-medium text-gray-600">上传食材图片开始吧</p>
                                    <p className="text-sm mt-2 text-gray-400">我会帮您识别食材并推荐食谱</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((message) => (
                                        <ChatMessage key={message.id} message={message}/>
                                    ))}
                                    <div ref={messagesEndRef}/>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 底部输入区域 */}
                    <div className="flex-shrink-0 px-6 pb-4 pt-2">
                        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <ChatInput onSend={handleSend} disabled={processing}/>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
