"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Send, Clock, CheckCircle2, MessageCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function TicketsPage() {
  const { user, userData } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [subject, setSubject] = useState('Order');
  const [subCategory, setSubCategory] = useState('Refill');
  const [orderIds, setOrderIds] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active ticket state (for chat modal)
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const q = query(collection(db, 'tickets'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
        return bTime - aTime || b.createdAt - a.createdAt;
      });
      setTickets(list);
      
      setActiveTicket(currentActive => {
        if (currentActive) {
          const updatedActive = list.find(t => t.id === currentActive.id);
          return updatedActive || currentActive;
        }
        return currentActive;
      });
      
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch tickets", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getSubCategories = (subj: string) => {
    if (subj === 'Order') return ['Refill', 'Cancel', 'Not Start'];
    if (subj === 'Payment') return ['Missing Deposit', 'Gateway Error', 'Other'];
    return ['General Inquiry', 'Bug Report', 'Other'];
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setSubject(newSubject);
    setSubCategory(getSubCategories(newSubject)[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = {
        uid: user?.uid,
        userName: userData?.name || user?.email,
        subject,
        subCategory,
        orderIds: subject === 'Order' ? orderIds : '',
        status: 'Pending',
        createdAt: Date.now(),
        updatedAt: serverTimestamp(),
        messages: [{
          role: 'user',
          message: message.trim(),
          createdAt: Date.now()
        }]
      };

      await addDoc(collection(db, 'tickets'), newTicket);
      setSuccess("Ticket created successfully!");
      setSubject('Order');
      setSubCategory('Refill');
      setOrderIds('');
      setMessage('');
      // No need to call fetchTickets, onSnapshot will handle it
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setReplying(true);
    try {
      const ticketRef = doc(db, 'tickets', activeTicket.id);
      const newMessages = [...(activeTicket.messages || []), {
        role: 'user',
        message: replyMessage.trim(),
        createdAt: Date.now()
      }];

      await updateDoc(ticketRef, {
        messages: newMessages,
        status: 'Pending', // Setting to pending as user replied
        updatedAt: serverTimestamp()
      });

      setActiveTicket({ ...activeTicket, messages: newMessages, status: 'Pending' });
      setReplyMessage('');
      // No need to call fetchTickets, onSnapshot will handle it
    } catch (err) {
      console.error("Failed to send reply", err);
    } finally {
      setReplying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Answered': return <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md text-xs border border-green-200">Answered</span>;
      case 'Closed': return <span className="text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-300">Closed</span>;
      default: return <span className="text-[#FF6B00] font-bold bg-orange-50 px-2 py-1 rounded-md text-xs border border-orange-200">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-[#D85700] rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6" /> Support Tickets</h2>
          <p className="text-orange-100 text-sm mt-1">Create a ticket to get help from our support team.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Create Ticket Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-[#D85700] p-4 text-white">
            <h3 className="font-bold">Create Ticket</h3>
            <p className="text-xs text-orange-100">You can create support ticket here.</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 border border-green-100">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                <select 
                  value={subject}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#FF6B00] outline-none"
                >
                  <option value="Order">Order</option>
                  <option value="Payment">Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sub Category</label>
                <select 
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#FF6B00] outline-none"
                >
                  {getSubCategories(subject).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {subject === 'Order' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Orders ID Example : 4010026, 4010027</label>
                  <input 
                    type="text"
                    value={orderIds}
                    onChange={(e) => setOrderIds(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#FF6B00] outline-none"
                    placeholder="E.g. 12345, 12346"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Messages</label>
                <textarea 
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#FF6B00] outline-none resize-none"
                  placeholder="Describe your issue..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[#6DAE43] hover:bg-[#5C9438] text-white font-bold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Now'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Ticket History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[800px]">
          <div className="bg-[#D85700] p-4 text-white shrink-0">
            <h3 className="font-bold">Ticket History</h3>
            <p className="text-xs text-orange-100">See your support ticket history here.</p>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No tickets found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setActiveTicket(ticket)}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">#{ticket.id.substring(0,6)}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1">
                        {ticket.subject} - {ticket.subCategory}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Last update</div>
                      <div className="text-xs text-slate-600 font-bold mt-0.5">
                        {new Date(ticket.createdAt).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Chat Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Ticket #{activeTicket.id.substring(0,6)}</h3>
                <p className="text-xs text-slate-500 font-medium">{activeTicket.subject} - {activeTicket.subCategory}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(activeTicket.status)}
                <button onClick={() => setActiveTicket(null)} className="h-8 w-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-200 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
              {activeTicket.messages?.map((msg: any, idx: number) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                    {msg.role === 'user' ? 'You' : 'Support'} • {new Date(msg.createdAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#FF6B00] text-white rounded-tr-sm shadow-md shadow-orange-200/50' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {activeTicket.status !== 'Closed' && (
              <form onSubmit={handleReply} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
                <input 
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FF6B00] transition"
                />
                <button 
                  type="submit"
                  disabled={replying || !replyMessage.trim()}
                  className="h-10 px-6 bg-[#FF6B00] hover:bg-[#e65c00] text-white rounded-xl font-bold flex items-center justify-center transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            {activeTicket.status === 'Closed' && (
              <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-sm font-bold text-slate-500">
                This ticket has been closed.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
