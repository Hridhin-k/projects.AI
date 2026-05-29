"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createTask } from "@/lib/db/actions";
import { fetchMembers } from "@/lib/db/actions";
import { fetchProjects } from "@/lib/db/project-actions";
import type { AIResponse } from "@/app/api/ai/task-assistant/route";
import TaskConfirmation from "./TaskConfirmation";
import type { User } from "@/lib/db/schema";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatBoxProps {
  projectId?: string;
}

export default function AIChatBox({ projectId }: AIChatBoxProps = {} as AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Projects.AI assistant. I can see your projects, tasks, and team — ask me things like \"what projects do we have?\" or \"who's working on what?\" You can also ask me to create a task.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [confirmationTask, setConfirmationTask] = useState<AIResponse["proposedTask"] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [audioSupported, setAudioSupported] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { notification, showNotification, clearNotification } = useNotification();

  useEffect(() => {
    // Load users on mount
    fetchMembers().then(setUsers);
    fetchProjects().then((list) =>
      setProjects(list.map((p) => ({ id: p.id, name: p.name })))
    );

    // Check if audio features are supported
    const hasSpeechRecognition = typeof window !== "undefined" && 
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
    
    setAudioSupported(hasSpeechRecognition || hasSpeechSynthesis);

    // Initialize Speech Recognition
    if (hasSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true; // Show interim results for better UX
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        const resultIndex = event.resultIndex ?? 0;
        for (let i = resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with final or interim transcript
        setInput(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          setIsListening(false);
          showNotification("Voice input captured!", "success");
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        let errorMessage = "Voice input error. Please try again.";
        
        if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try again.";
        } else if (event.error === "not-allowed") {
          errorMessage = "Microphone permission denied. Please enable it in your browser settings.";
        } else if (event.error === "network") {
          errorMessage = "Network error. Please check your connection.";
        }
        
        showNotification(errorMessage, "error");
      };

      recognition.onstart = () => {
        // Don't show notification for start - visual indicator is enough
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize Speech Synthesis
    if (hasSpeechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to stop listening/speaking
      if (e.key === "Escape") {
        if (isListening) {
          stopListening();
        }
        if (isSpeaking) {
          synthRef.current?.cancel();
          setIsSpeaking(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, isSpeaking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) {
      showNotification("Text-to-speech is not supported in your browser", "error");
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      showNotification("Error reading message", "error");
    };
    
    synthRef.current.speak(utterance);
  }, [showNotification]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      showNotification("Voice input is not supported in your browser", "error");
      return;
    }
    
    if (isListening) {
      stopListening();
      return;
    }

    try {
      setIsListening(true);
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
      showNotification("Failed to start voice input. Please try again.", "error");
    }
  }, [isListening, showNotification]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
      setIsListening(false);
    }
  }, [isListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const conversation = [...messages, { role: "user" as const, content: userMessage }];
    setInput("");
    setMessages(conversation);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/task-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation,
          projectId,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(body.message || body.error || "Failed to get AI response");
      }

      const aiResponse: AIResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse.conversationReply },
      ]);

      // Speak the response
      speak(aiResponse.conversationReply);

      // Show confirmation modal if action is LOG_TASK
      if (aiResponse.action === "LOG_TASK" && aiResponse.proposedTask) {
        setConfirmationTask(aiResponse.proposedTask);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "I apologize, but I encountered an error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTask = async () => {
    if (!confirmationTask) return;

    try {
      await createTask({
        title: confirmationTask.title,
        description: confirmationTask.description,
        assigneeId: confirmationTask.assigneeId,
        dueDate: confirmationTask.dueDate,
        projectId: confirmationTask.projectId,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Task "${confirmationTask.title}" has been created successfully!`,
        },
      ]);

      // Refresh users to update workload
      const updatedUsers = await fetchMembers();
      setUsers(updatedUsers);

      // Dispatch custom event to refresh dashboard
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("taskCreated"));
      }

      setConfirmationTask(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but there was an error creating the task. Please try again.",
        },
      ]);
      setConfirmationTask(null);
    }
  };

  const handleCancelTask = () => {
    setConfirmationTask(null);
  };

  const assigneeName = confirmationTask
    ? users.find((u) => u.id === confirmationTask.assigneeId)?.name
    : undefined;

  const projectName = confirmationTask
    ? projects.find((p) => p.id === confirmationTask.projectId)?.name
    : undefined;

  return (
    <>
      <div className="flex flex-col h-full bg-gray-900">
        {/* Notification */}
        {notification && (
          <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={clearNotification}
            />
          </div>
        )}

        {/* Help Button and Panel */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-purple-700/20 bg-gray-800/50 flex-shrink-0 flex items-center justify-end">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle help"
            title="Keyboard shortcuts and tips"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        
        {/* Help Panel */}
        {showHelp && (
          <div className="px-3 sm:px-4 py-3 border-b border-purple-700/20 bg-gray-800/80 flex-shrink-0">
            <div className="p-3 bg-gray-800/80 border border-purple-700/30 rounded-lg text-xs text-gray-300 space-y-2">
              <div className="font-semibold text-white mb-2">Quick Tips:</div>
              <div>• Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Ctrl/Cmd + /</kbd> to focus input</div>
              <div>• Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Esc</kbd> to stop listening/speaking</div>
              <div>• Click the microphone to use voice input</div>
              <div>• Click the speaker to hear the last message</div>
              {!audioSupported && (
                <div className="text-yellow-400 mt-2">⚠️ Voice features require Chrome, Edge, or Safari</div>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-scale`}
              style={{ animationDelay: `${idx * 50}ms` }}
              role={msg.role === "assistant" ? "article" : undefined}
              aria-label={msg.role === "assistant" ? "AI Assistant message" : "Your message"}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-purple-800/80 text-gray-200 hover:bg-purple-900/80"
                    : "bg-gray-800 text-gray-300 border border-purple-800/15 hover:border-purple-800/25"
                }`}
              >
                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-purple-700/20 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-purple-700/20 flex-shrink-0">
          {/* Listening indicator */}
          {isListening && (
            <div className="mb-2 flex items-center gap-2 text-xs text-red-400 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span>Listening... Speak now</span>
            </div>
          )}
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="mb-2 flex items-center gap-2 text-xs text-teal-400">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
              <span>Speaking...</span>
            </div>
          )}

          <div className="flex gap-1.5 sm:gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice input..."}
              className="flex-1 px-3 sm:px-4 py-2 bg-gray-800 border border-purple-700/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-700/50 text-sm disabled:opacity-50 transition-all duration-200 focus:border-purple-700/50"
              disabled={isLoading || isListening}
              aria-label="Message input"
              aria-describedby="input-help"
            />
            <div id="input-help" className="sr-only">
              Type your message or use the microphone button for voice input. Press Ctrl+Slash to focus this field.
            </div>
            
            {/* Microphone Button */}
            <button
              type="button"
              onClick={startListening}
              disabled={!audioSupported || isLoading}
              className={`px-2 sm:px-3 py-2 rounded-lg border transition-all flex-shrink-0 relative ${
                isListening
                  ? "bg-red-800 border-red-700 text-white animate-pulse shadow-lg shadow-red-800/30"
                  : "bg-gray-800 border-purple-700/20 text-gray-300 hover:bg-gray-700 hover:border-purple-700/40 disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              title={isListening ? "Stop listening (or press Esc)" : audioSupported ? "Start voice input" : "Voice input not supported"}
            >
              {isListening ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            
            {/* Speaker Button */}
            <button
              type="button"
              onClick={() => {
                const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
                if (lastAssistantMessage) {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    speak(lastAssistantMessage.content);
                  }
                } else {
                  showNotification("No message to read", "info");
                }
              }}
              disabled={!audioSupported || isLoading || messages.filter(m => m.role === "assistant").length === 0}
              className={`px-2 sm:px-3 py-2 rounded-lg border transition-all flex-shrink-0 ${
                isSpeaking
                  ? "bg-teal-600 border-teal-500 text-white animate-pulse shadow-lg shadow-teal-500/50"
                  : "bg-gray-800 border-purple-700/20 text-gray-300 hover:bg-gray-700 hover:border-purple-700/40 disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              aria-label={isSpeaking ? "Stop speaking" : "Read last message"}
              title={isSpeaking ? "Stop speaking (or press Esc)" : audioSupported ? "Read last message" : "Text-to-speech not supported"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isListening}
              className="px-3 sm:px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-700/50 hover:shadow-lg hover:shadow-purple-700/20 hover:-translate-y-0.5 active:translate-y-0"
              aria-label="Send message"
            >
              <span className="hidden sm:inline">Send</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        </form>
      </div>

      {confirmationTask && (
        <TaskConfirmation
          proposedTask={confirmationTask}
          onConfirm={handleConfirmTask}
          onCancel={handleCancelTask}
          assigneeName={assigneeName}
          projectName={projectName}
        />
      )}
    </>
  );
}

