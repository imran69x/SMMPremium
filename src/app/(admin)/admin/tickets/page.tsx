"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Send, CheckCircle2, MessageCircle, AlertCircle, RefreshCw, X, Search, ShieldAlert } from 'lucide-react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Active ticket state (for chat modal)
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis() || b.createdAt - a.createdAt);
      setTickets(list);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setReplying(true);
    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const newMessages = [...(activeTicket.messages || []), {
        role: 'admin',
        message: replyMessage.trim(),
        createdAt: Date.now()
      }];

      await updateDoc(ticketRef, {
        messages: newMessages,
        status: 'Answered', // Automatically mark as Answered when admin replies
        updatedAt: serverTimestamp()
      });

      setActiveTicket({ ...activeTicket, messages: newMessages, status: 'Answered' });
      setReplyMessage('');
      fetchTickets();
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeTicket) return;
    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setActiveTicket({ ...activeTicket, status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error("Failed to change status", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Answered': return <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md text-xs border border-green-200">Answered</span>;
      case 'Closed': return <span className="text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-300">Closed</span>;
      default: return <span className="text-[#FF6B00] font-bold bg-orange-50 px-2 py-1 rounded-md text-xs border border-orange-200">Pending</span>;
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter !== 'All' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || 
             t.userName?.toLowerCase().includes(q) || 
             t.uid?.toLowerCase().includes(q) ||
             t.subject?.toLowerCase().includes(q) ||
             t.orderIds?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold flex items-center gap-3"><ShieldAlert className="h-8 w-8 text-[#FF6B00]" /> Support Tickets (Admin)</h2>
          <p className="text-slate-300 text-sm mt-2 font-medium max-w-lg">Manage user support tickets, answer questions, and resolve issues.</p>
        </div>
      </div>

      {/* Filters & List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="flex gap-2 w-full md:w-auto">
            {['All', 'Pending', 'Answered', 'Closed'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex-1 md:flex-none ${filter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-slate-400 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />Loading...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">No tickets found.</td></tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setActiveTicket(ticket)}>
                    <td className="px-6 py-4 font-bold text-slate-800">#{ticket.id.substring(0,6)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{ticket.userName || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{ticket.uid?.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{ticket.subject} - {ticket.subCategory}</div>
                      {ticket.orderIds && <div className="text-xs text-[#FF6B00] font-medium mt-0.5">Orders: {ticket.orderIds}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(ticket.createdAt).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Chat Modal (Admin View) */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-800 p-4 sm:p-6 flex items-start sm:items-center justify-between text-white flex-col sm:flex-row gap-4">
              <div>
                <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">Ticket #{activeTicket.id.substring(0,8)} {getStatusBadge(activeTicket.status)}</h3>
                <div className="text-sm text-slate-300 font-medium mt-1">
                  User: <span className="text-white">{activeTicket.userName}</span> ({activeTicket.uid})
                </div>
                <div className="text-sm text-slate-300 font-medium mt-0.5">
                  Subject: <span className="text-white">{activeTicket.subject} - {activeTicket.subCategory}</span>
                </div>
                {activeTicket.orderIds && (
                  <div className="text-sm text-orange-300 font-bold mt-1">
                    Related Orders: {activeTicket.orderIds}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {activeTicket.status !== 'Pending' && (
                  <button onClick={() => handleStatusChange('Pending')} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition">Mark Pending</button>
                )}
                {activeTicket.status !== 'Closed' && (
                  <button onClick={() => handleStatusChange('Closed')} className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-bold transition">Close Ticket</button>
                )}
                <button onClick={() => setActiveTicket(null)} className="h-8 w-8 bg-slate-700 text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-600 hover:text-white transition ml-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
              {activeTicket.messages?.map((msg: any, idx: number) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                    {msg.role === 'admin' ? 'You (Admin)' : 'User'} • {new Date(msg.createdAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl text-sm ${
                    msg.role === 'admin' 
                      ? 'bg-slate-800 text-white rounded-tr-sm shadow-md' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleReply} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply to the user..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-800 transition"
              />
              <button 
                type="submit"
                disabled={replying || !replyMessage.trim()}
                className="h-12 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center transition disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" /> Reply
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
