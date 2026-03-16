import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, Search, MessageSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function fmtTime(dt: string | null | undefined) {
  if (!dt) return "";
  try { return format(new Date(dt), "hh:mm a"); } catch { return ""; }
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const COLORS = ["bg-green-600", "bg-blue-600", "bg-purple-600", "bg-amber-500", "bg-rose-500", "bg-teal-600"];
function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Person { id: number; name: string; type: string; code?: string; }
interface EmployeeChatProps {
  employee: { id: number; fullName: string; employeeId: string };
}

export default function EmployeeChat({ employee }: EmployeeChatProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPeopleList, setShowPeopleList] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/chat/contacts"],
    queryFn: async () => {
      const r = await fetch("/api/employee/chat/contacts", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 5000,
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/employee/chat/people"],
    queryFn: async () => {
      const r = await fetch("/api/employee/chat/people", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/chat/messages", selectedPerson?.id, selectedPerson?.type],
    queryFn: async () => {
      if (!selectedPerson) return [];
      const r = await fetch(`/api/employee/chat/messages/${selectedPerson.id}?targetType=${selectedPerson.type}`, { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!selectedPerson,
    refetchInterval: selectedPerson ? 3000 : false,
  });

  useEffect(() => {
    if (selectedPerson) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, selectedPerson]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPerson || !message.trim()) return;
      const r = await fetch("/api/employee/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          receiverId: selectedPerson.id,
          receiverType: selectedPerson.type,
          receiverName: selectedPerson.name,
          message: message.trim(),
        }),
      });
      if (!r.ok) throw new Error("Failed to send");
      return r.json();
    },
    onSuccess: () => {
      setMessage("");
      qc.invalidateQueries({ queryKey: ["/api/employee/chat/messages", selectedPerson?.id, selectedPerson?.type] });
      qc.invalidateQueries({ queryKey: ["/api/employee/chat/contacts"] });
    },
    onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
  });

  // People list (for new chat) filtered
  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Show people selector overlay
  if (showPeopleList) {
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 -mx-4 -mt-4 mb-4 flex items-center gap-3">
          <button onClick={() => { setShowPeopleList(false); setSearch(""); }} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-base">Employee / Admin</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700"
            data-testid="input-chat-search"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-0 divide-y divide-gray-100">
          {filteredPeople.map(p => (
            <button
              key={`${p.type}-${p.id}`}
              className="w-full flex items-center gap-3 px-1 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => { setSelectedPerson(p); setShowPeopleList(false); setSearch(""); }}
              data-testid={`button-select-chat-${p.id}`}
            >
              <div className={`w-10 h-10 rounded-full ${colorFor(p.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {initials(p.name)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-700">{p.name}</p>
              </div>
              <span className="text-xs text-gray-400 capitalize">{p.type}</span>
            </button>
          ))}
          {filteredPeople.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No people found</div>
          )}
        </div>
      </div>
    );
  }

  // Chat conversation view
  if (selectedPerson) {
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* Header */}
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 -mx-4 -mt-4 mb-0 flex items-center gap-3">
          <button onClick={() => setSelectedPerson(null)} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className={`w-8 h-8 rounded-full ${colorFor(selectedPerson.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {initials(selectedPerson.name)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{selectedPerson.name}</p>
            <p className="text-xs text-green-200 capitalize">{selectedPerson.type}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {msgsLoading ? (
            <div className="flex justify-center pt-12"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderType === "employee" && msg.senderName === employee.fullName;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`msg-${msg.id}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-green-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-green-200" : "text-gray-400"}`}>{fmtTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 pt-3 pb-1 flex items-end gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-end gap-2">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type something..."
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24 overflow-y-auto"
              style={{ minHeight: "20px" }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                  e.preventDefault();
                  sendMutation.mutate();
                }
              }}
              data-testid="input-chat-message"
            />
          </div>
          <button
            onClick={() => message.trim() && sendMutation.mutate()}
            disabled={!message.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-60 flex items-center justify-center shrink-0 transition-colors"
            data-testid="button-send-chat"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>
    );
  }

  // Contacts list (default)
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-5 pb-4 -mx-4 -mt-4 mb-4 flex items-center justify-between">
        <span className="font-semibold text-base">Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <MessageSquare className="h-16 w-16 opacity-20" />
            <p className="text-sm text-center">No conversations yet.<br />Start a new chat below.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {contacts.map(c => (
              <button
                key={`${c.type}-${c.id}`}
                className="w-full flex items-center gap-3 px-1 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                onClick={() => setSelectedPerson({ id: c.id, name: c.name, type: c.type })}
                data-testid={`button-contact-${c.id}`}
              >
                <div className={`w-11 h-11 rounded-full ${colorFor(c.name)} flex items-center justify-center text-white text-sm font-bold shrink-0 relative`}>
                  {initials(c.name)}
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400 shrink-0 ml-2">{fmtTime(c.lastAt)}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={() => setShowPeopleList(true)}
          className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center transition-colors"
          data-testid="button-new-chat"
        >
          <Plus className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}
