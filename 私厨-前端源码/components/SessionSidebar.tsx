/**
 * 会话侧边栏组件：新建会话 + 历史会话列表
 */
import {SessionInfo} from "@/types/chat";
import {MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Trash2} from "lucide-react";

interface SessionSidebarProps {
    sessions: SessionInfo[];
    activeSessionId: string;
    collapsed: boolean;
    onNewChat: () => void;
    onSelect: (sessionId: string) => void;
    onDelete: (sessionId: string) => void;
    onToggle: () => void;
}

export function SessionSidebar({sessions, activeSessionId, collapsed, onNewChat, onSelect, onDelete, onToggle}: SessionSidebarProps) {
    // 收起态：仅保留展开与新建会话按钮的窄条
    if (collapsed) {
        return (
            <aside className="w-14 flex-shrink-0 border-r border-gray-200 bg-[#f7f6f3] flex flex-col items-center gap-2 py-3">
                <button
                    onClick={onToggle}
                    title="展开侧边栏"
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
                >
                    <PanelLeftOpen size={18}/>
                </button>
                <button
                    onClick={onNewChat}
                    title="新建会话"
                    className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-sm transition-all"
                >
                    <Plus size={18}/>
                </button>
            </aside>
        );
    }

    return (
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-[#f7f6f3] flex flex-col">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">历史会话</span>
                <button
                    onClick={onToggle}
                    title="收起侧边栏"
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
                >
                    <PanelLeftClose size={16}/>
                </button>
            </div>
            <div className="px-4 pb-3">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-medium shadow-sm transition-all"
                >
                    <Plus size={16}/>
                    <span>新建会话</span>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
                {sessions.map((session) => {
                    const active = session.thread_id === activeSessionId;
                    return (
                        <div key={session.thread_id} className="group relative">
                            <button
                                onClick={() => onSelect(session.thread_id)}
                                title={session.title}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                                    active
                                        ? "bg-orange-50 border border-orange-200 text-orange-600"
                                        : "border border-transparent text-gray-600 hover:bg-gray-200/60"
                                }`}
                            >
                                <MessageSquare size={15} className={active ? "text-orange-500 flex-shrink-0" : "text-gray-400 flex-shrink-0"}/>
                                <span className="truncate flex-1">{session.title}</span>
                            </button>
                            <button
                                onClick={() => onDelete(session.thread_id)}
                                title="删除该会话"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    );
                })}
                {sessions.length === 0 && (
                    <p className="text-xs text-gray-400 text-center pt-8">暂无历史会话，开始聊天吧</p>
                )}
            </div>
        </aside>
    );
}
