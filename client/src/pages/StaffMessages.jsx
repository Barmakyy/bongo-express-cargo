import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInbox, FaPaperPlane, FaSpinner, FaTimes } from 'react-icons/fa';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

const StaffMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const { showNotification } = useNotification();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff-dashboard/messages');
      setMessages(res.data.data.messages);
    } catch (err) {
      showNotification('Failed to fetch messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setIsReplying(true);
    try {
      await api.post(`/staff-dashboard/messages/${selectedMessage._id}/reply`, { replyBody });
      showNotification('Reply sent successfully!', 'success');
      setSelectedMessage(null);
      setReplyBody('');
      fetchMessages(); // Refresh messages
    } catch (err) {
      showNotification('Failed to send reply.', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-soft-lg">
      <h1 className="text-2xl font-bold text-primary mb-6">Customer Messages</h1>
      {loading ? (
        <div className="text-center p-10"><FaSpinner className="animate-spin text-primary text-3xl mx-auto" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center p-10 text-gray-500">
          <FaInbox size={40} className="mx-auto mb-4" />
          <p>No messages related to your assigned shipments.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li key={msg._id} onClick={() => setSelectedMessage(msg)} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-primary">{msg.subject}</p>
                  <p className="text-sm text-gray-600">From: {msg.sender}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${msg.status === 'Unread' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{msg.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(msg.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-2xl"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">{selectedMessage.subject}</h2>
                <button onClick={() => setSelectedMessage(null)}><FaTimes /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-gray-500">From: {selectedMessage.sender} ({selectedMessage.email})</p>
                <p className="mt-4 whitespace-pre-wrap">{selectedMessage.body}</p>
                {selectedMessage.reply && (
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg border-l-4 border-primary">
                    <p className="font-semibold text-primary">Your Reply:</p>
                    <p className="text-gray-700 mt-2">{selectedMessage.reply}</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleReplySubmit} className="p-6 border-t bg-gray-50">
                <h3 className="font-semibold mb-2">Send Reply</h3>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows="4"
                  className="w-full p-2 border rounded-md"
                  placeholder="Type your response here..."
                  required
                ></textarea>
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={isReplying} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 flex items-center disabled:bg-primary/70">
                    {isReplying ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperPlane className="mr-2" />}
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffMessages;