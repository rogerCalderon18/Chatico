"use client";

import { Input } from "@/components/ui/input";
import { Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Options } from "react-markdown";
import React from "react";
import ProjectOverview from "@/components/project-overview";
import { LoadingIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const [toolCall, setToolCall] = useState<string>();
  const [isPlayingBomba, setIsPlayingBomba] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      maxSteps: 4,
      onToolCall({ toolCall }) {
        console.log("Tool call detected:", toolCall);
        setToolCall(toolCall.toolName);
        
        // Detectar si es una bomba
        if (toolCall.toolName === 'reciteBomba') {
          console.log("🎵 Bomba detected! Playing music...");
          setIsPlayingBomba(true);
          playBombaMusic();
        }
      },
      onError: (error) => {
        toast.error("You've been rate limited, please try again later!");
      },
    });

  const playBombaMusic = () => {
    // Reproducir música tradicional costarricense
    const audio = new Audio('/music/bomba.mp3'); // Agrega tu archivo de música
    audio.play().catch(console.error);
    
    // Opcional: parar la música después de un tiempo
    setTimeout(() => {
      setIsPlayingBomba(false);
      audio.pause();
    }, 30000); // 30 segundos
  };

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  const currentToolCall = useMemo(() => {
    const tools = messages?.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName;
    } else {
      return undefined;
    }
  }, [toolCall, messages]);

  const awaitingResponse = useMemo(() => {
    if (
      isLoading &&
      currentToolCall === undefined &&
      messages.slice(-1)[0]?.role === "user"
    ) {
      return true;
    } else {
      return false;
    }
  }, [isLoading, currentToolCall, messages]);

  return (
    <div className="flex justify-center items-start sm:pt-16 min-h-screen w-full dark:bg-red-900 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-[500px]">
        <ProjectOverview />
        <motion.div
          animate={{
            minHeight: isExpanded ? 400 : 0,
            padding: isExpanded ? 12 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.5,
          }}
          className={cn(
            "rounded-lg w-full flex flex-col",
            isExpanded
              ? "bg-neutral-200 dark:bg-neutral-800"
              : "bg-transparent",
          )}
        >
          <div className="flex flex-col w-full justify-between gap-2 h-full">
            {/* Área de mensajes del chat */}
            <div className="flex-1 overflow-y-auto max-h-80 mb-4">
              <motion.div
                transition={{
                  type: "spring",
                }}
                className="flex flex-col gap-3"
              >
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {message.role === "user" ? (
                        <UserMessage message={message} />
                      ) : (
                        <AssistantMessage message={message} />
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Mostrar loading solo si está esperando respuesta */}
                  {(awaitingResponse || currentToolCall) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="px-2"
                    >
                      <Loading tool={currentToolCall} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Formulario de input */}
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                className={`bg-neutral-100 text-base w-full text-neutral-700 dark:bg-neutral-700 dark:placeholder:text-neutral-400 dark:text-neutral-300`}
                minLength={3}
                required
                value={input}
                placeholder={"Ask me anything..."}
                onChange={handleInputChange}
              />
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <div className="px-2 flex justify-end">
      <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-[80%] text-sm">
        {message.content}
      </div>
    </div>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
  if (!message.content) return null;

  // Detectar si el mensaje contiene una bomba
  const isBomba = message.toolInvocations?.some(tool => tool.toolName === 'reciteBomba');

  return (
    <div className="px-2 flex justify-start">
      <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${
        isBomba 
          ? 'bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-800 dark:to-orange-800 border-2 border-yellow-400' 
          : 'bg-white dark:bg-neutral-700'
      }`}>
        {isBomba && (
          <div className="flex items-center gap-2 mb-2 text-orange-600 dark:text-orange-400">
            <span className="text-lg">🎵</span>
            <span className="font-semibold text-xs">Bomba Guanacasteca</span>
            <span className="text-lg animate-pulse">🎶</span>
          </div>
        )}
        <MemoizedReactMarkdown
          className="text-neutral-800 dark:text-neutral-200"
        >
          {message.content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const toolName =
    tool === "getInformation"
      ? "Getting information"
      : tool === "addResource"
        ? "Adding information"
        : tool === "reciteBomba"
          ? "🎵 Preparando bomba guanacasteca..."
          : "Thinking";

  return (
    <div className="flex justify-start">
      <div className="bg-white dark:bg-neutral-700 px-3 py-2 rounded-lg">
        <div className="flex flex-row gap-2 items-center">
          <div className="animate-spin dark:text-neutral-400 text-neutral-500">
            <LoadingIcon />
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            {toolName}...
          </div>
        </div>
      </div>
    </div>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);