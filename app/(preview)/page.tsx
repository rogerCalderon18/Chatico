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
    <div 
      className="flex justify-center items-center min-h-screen w-full px-4 md:px-0 py-4"
      style={{
        backgroundImage: 'url(/ChaticoFondo2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1e293b' // Fallback color
      }}
    >
      <div className="flex flex-col items-center w-full max-w-[1100px]">
        
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-blue-800 drop-shadow-2xl">
            Bienvenid@ a ChaTico
          </h1>
          <p className="text-lg md:text-xl text-red-400 mt-2 opacity-90">
            Conversá con un experto en historia, cultura y costumbres ticas
          </p>
        </motion.div>

        <motion.div
          animate={{
            minHeight: isExpanded ? 500 : 0,
            padding: isExpanded ? 20 : 0,
          }}
          transition={{
            type: "spring",
            bounce: 0.3,
            duration: 0.6
          }}
          className={cn(
            "rounded-2xl w-full flex flex-col backdrop-blur-sm",
            isExpanded
              ? "bg-white/80 dark:bg-neutral-900/80 shadow-2xl border border-white/20"
              : "bg-transparent",
          )}
        >
          <div className="flex flex-col w-full justify-between gap-4 h-full">
            {/* Área de mensajes del chat */}
            <div className="flex-1 overflow-y-auto max-h-96 mb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <motion.div
                transition={{
                  type: "spring",
                }}
                className="flex flex-col gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 500 }}
                      className="px-2"
                    >
                      <Loading tool={currentToolCall} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Formulario de input mejorado */}
            <motion.form 
              onSubmit={handleSubmit} 
              className="flex space-x-3 bg-white/50 dark:bg-neutral-800/50 p-3 rounded-xl backdrop-blur-sm border border-white/20"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Input
                className="bg-white/80 dark:bg-neutral-700/80 text-base w-full text-gray-800 dark:text-neutral-300 border-none shadow-lg rounded-xl px-4 py-3 placeholder:text-neutral-400 focus:ring-2 focus:ring-blue-700 transition-all duration-200"
                minLength={3}
                required
                value={input}
                placeholder="¡Pura vida! ¿En qué puedo ayudarte?..."
                onChange={handleInputChange}
              />
              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-800 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src="/enviar.png" 
                  alt="Enviar" 
                  className="w-5 h-5"
                />
              </motion.button>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <motion.div 
      className="px-2 flex justify-end items-end gap-3 mb-4"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-2xl rounded-br-md max-w-[80%] text-sm shadow-xl border border-blue-500/20">
        <p className="leading-relaxed">{message.content}</p>
        <div className="text-xs text-blue-100 mt-2 opacity-70">
          {new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-xl border-2 border-white/20 overflow-hidden">
        <img 
          src="/usuario.png" 
          alt="Usuario Avatar" 
          className="w-6 h-6 object-cover"
        />
      </div>
    </motion.div>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
  if (!message.content) return null;

  const isBomba = message.toolInvocations?.some(tool => tool.toolName === 'reciteBomba');

  return (
    <motion.div 
      className="px-2 flex justify-start items-end gap-3 mb-4"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-xl border-2 border-white/20 overflow-hidden">
        <img 
          src="/guacamayo.png" 
          alt="Chatico Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className={`px-5 py-4 rounded-2xl rounded-bl-md max-w-[80%] text-sm shadow-xl ${
        isBomba 
          ? 'bg-gradient-to-r from-gray-100 to-gray-100 dark:from-blue-900/50 dark:to-red-900/50 border border-gray-200 shadow-red-200/50' 
          : 'bg-gradient-to-r from-white to-gray-50 dark:from-neutral-800/80 dark:to-neutral-700/80 border border-gray-200/50 dark:border-neutral-600/50'
      }`}>
        {isBomba && (
          <motion.div 
            className="flex items-center gap-2 mb-3 text-white bg-red-600 dark:bg-red-600 px-4 py-2 rounded-lg border border-blue-600"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <span className="text-lg">🎵</span>
            <span className="font-semibold text-2xs">Bomba Guanacasteca</span>
            <motion.span 
              className="text-lg"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🎶
            </motion.span>
          </motion.div>
        )}
        <MemoizedReactMarkdown
          className="text-neutral-800 dark:text-neutral-200 leading-relaxed"
        >
          {message.content}
        </MemoizedReactMarkdown>
        <div className="text-xs text-gray-400 mt-2 opacity-70">
          {new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const toolName =
    tool === "getInformation"
      ? "Obteniendo información"
      : tool === "addResource"
        ? "Agregando información"
        : tool === "reciteBomba"
          ? "🎵 Preparando bomba guanacasteca..."
          : "Pensando";

  return (
    <motion.div 
      className="flex justify-start items-end gap-3 mb-4"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-xl border-2 border-white/20 overflow-hidden">
        <motion.img 
          src="/guacamayo.png" 
          alt="Chatico Avatar" 
          className="w-full h-full object-cover"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>
      <div className="bg-gradient-to-r from-white to-gray-50 dark:from-neutral-800/80 dark:to-neutral-700/80 px-5 py-4 rounded-2xl rounded-bl-md shadow-xl border border-gray-200/50 dark:border-neutral-600/50">
        <div className="flex flex-row gap-3 items-center">
          <motion.div 
            className="text-green-500 dark:text-green-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <LoadingIcon />
          </motion.div>
          <div className="text-neutral-600 dark:text-neutral-300 text-sm font-medium">
            {toolName}...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);