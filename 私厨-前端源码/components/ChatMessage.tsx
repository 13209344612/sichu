/**
 * 聊天消息组件
 */
import {Message} from "@/types/chat";
import {User, Loader2} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({message}: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
            {/* 头像 */}
            <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br from-orange-400 to-orange-600"
            >
                {isUser ? (
                    <User size={16} className="text-white"/>
                ) : (
                    <span className="text-white text-xs font-bold">AI</span>
                )}
            </div>

            {/* 消息内容 */}
            {isUser ? (
                <div className="max-w-[75%] rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-3 shadow-sm">
                    {message.content && (
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">
                            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                        </p>
                    )}
                    {message.imageUrl && (
                        <img
                            src={message.imageUrl}
                            alt="上传的图片"
                            className={`rounded-lg w-full max-w-md object-cover ${message.content ? "mt-2" : ""}`}
                        />
                    )}
                </div>
            ) : (
                <div className="max-w-[75%] lg:max-w-[720px] rounded-2xl bg-white border border-gray-200/80 shadow-sm px-5 py-4 text-gray-800">
                    {message.streaming && !message.content ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Loader2 size={16} className="animate-spin text-orange-500"/>
                            <span>正在思考中...</span>
                        </div>
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                                h3: ({children}) => <h3 className="text-[15px] font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                                p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
                                ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1 text-sm">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-sm">{children}</ol>,
                                li: ({children}) => <li className="mb-1 leading-relaxed">{children}</li>,
                                a: ({href, children}) => <a href={href} className="text-orange-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                code: ({children}) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                                pre: ({children}) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                                blockquote: ({children}) => <blockquote className="border-l-4 border-orange-300 pl-3 italic text-gray-600 mb-2">{children}</blockquote>,
                                table: ({children}) => <table className="w-full border-collapse mb-3 text-sm">{children}</table>,
                                thead: ({children}) => <thead className="bg-amber-100/70">{children}</thead>,
                                tbody: ({children}) => <tbody className="bg-white">{children}</tbody>,
                                tr: ({children}) => <tr>{children}</tr>,
                                th: ({children}) => <th className="border border-amber-200/70 px-3 py-2 text-left font-semibold text-amber-900">{children}</th>,
                                td: ({children}) => <td className="border border-gray-200 px-3 py-2 text-gray-700">{children}</td>,
                            }}
                        >
                            {String(message.content || "")}
                        </ReactMarkdown>
                    )}
                </div>
            )}
        </div>
    );
}
