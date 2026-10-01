import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { apiFetch, apiPost } from "../api.js";
import { ArrowLeft, MessagesSquare, Package, Reply, X } from "lucide-react";

// Messages are grouped into conversations.
// A conversation = the messages with one other user about one item.
// The open conversation is kept in the address: /messages?item=5&user=2
function Inbox() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const itemId = Number(searchParams.get("item")) || null;
  const otherId = Number(searchParams.get("user")) || null;

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // New message states
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  // Remembers which conversation is open, so a slow answer for an
  // older conversation is not shown in the new one
  const openKey = useRef("");

  // Increased after sending a message, so the data is loaded again at once
  const [reloadKey, setReloadKey] = useState(0);

  // Load now, then check for new messages every 5 seconds
  useEffect(() => {
    if (!userId) {
      return;
    }

    const key = `${itemId}-${otherId}`;
    openKey.current = key;

    const refresh = async () => {
      try {
        if (itemId && otherId) {
          const response = await apiFetch(
            `get-messages.php?item_id=${itemId}&user_id=${otherId}`
          );

          const data = await response.json();

          if (data.success && openKey.current === key) {
            setMessages(data.messages);

            // Only the conversation that is open is marked as read
            const hasUnread = data.messages.some(
              (message) =>
                Number(message.receiver_id) === Number(userId) &&
                !message.is_read
            );

            if (hasUnread) {
              await apiPost("mark-messages-read.php", {
                item_id: itemId,
                user_id: otherId,
              });
            }
          }
        }

        const response = await apiFetch("get-conversations.php");

        const data = await response.json();

        if (data.success) {
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    refresh();

    const interval = setInterval(refresh, 5000);

    return () => clearInterval(interval);
  }, [userId, itemId, otherId, reloadKey]);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [messages.length]);

  const openConversation = (conversation) => {
    setMessages([]);
    setReplyTo(null);
    setText("");

    setSearchParams({
      item: conversation.item_id,
      user: conversation.other_id,
    });
  };

  const closeConversation = () => {
    setMessages([]);
    setReplyTo(null);
    setText("");

    setSearchParams({});
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    setSending(true);

    try {
      const response = await apiPost("send-message.php", {
        receiver_id: otherId,
        item_id: itemId,
        message: text.trim(),
        reply_to: replyTo ? replyTo.id : null,
      });

      const data = await response.json();

      if (data.success) {
        setText("");
        setReplyTo(null);

        setReloadKey((key) => key + 1);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="details-state">
        <h3>Please login to view your messages.</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="details-state">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  const isOpen = Boolean(itemId && otherId);

  const openConversationInfo = conversations.find(
    (conversation) =>
      Number(conversation.item_id) === itemId &&
      Number(conversation.other_id) === otherId
  );

  // A conversation started from another page has no messages yet,
  // so its names come from the link that opened it
  const otherName =
    openConversationInfo?.other_name ||
    location.state?.otherName ||
    "User";

  const itemTitle =
    openConversationInfo?.item_title ||
    location.state?.itemTitle ||
    "Item";

  return (
    <div className="messages-page">

      <div className="messages-container inbox-container">

        <div className="messages-header">
          <h1>Messages</h1>
          <p>Your conversations about lost and found items.</p>
        </div>

        {conversations.length === 0 && !isOpen ? (

          <div className="messages-empty">

            <div className="messages-empty-icon">
              <MessagesSquare size={36} strokeWidth={1.5} />
            </div>

            <h3>No messages yet</h3>

            <p>
              When someone contacts you about an item,
              your messages will appear here.
            </p>

          </div>

        ) : (

          <div
            className={`inbox-layout ${
              isOpen ? "conversation-open" : ""
            }`}
          >

            {/* Conversation list */}
            <div className="conversation-list">

              {conversations.map((conversation) => {

                const isActive =
                  Number(conversation.item_id) === itemId &&
                  Number(conversation.other_id) === otherId;

                const sentByMe =
                  Number(conversation.last_sender_id) ===
                  Number(userId);

                return (
                  <button
                    type="button"
                    key={`${conversation.item_id}-${conversation.other_id}`}
                    className={`conversation-row ${
                      isActive ? "active-conversation" : ""
                    }`}
                    onClick={() => openConversation(conversation)}
                  >

                    <div className="conversation-row-top">

                      <strong>
                        {conversation.other_name}
                      </strong>

                      {conversation.unread_count > 0 && (
                        <span className="message-badge">
                          {conversation.unread_count}
                        </span>
                      )}

                    </div>

                    <span className="conversation-item">
                      <Package size={13} /> {conversation.item_title}
                    </span>

                    <span className="conversation-preview">
                      {sentByMe ? "You: " : ""}
                      {conversation.last_message}
                    </span>

                    <span className="message-date">
                      {new Date(
                        conversation.last_at
                      ).toLocaleString()}
                    </span>

                  </button>
                );
              })}

            </div>

            {/* Open conversation */}
            <div className="thread">

              {!isOpen ? (

                <div className="thread-placeholder">
                  <div className="messages-empty-icon">
                    <MessagesSquare size={36} strokeWidth={1.5} />
                  </div>

                  <p>Select a conversation to read it.</p>
                </div>

              ) : (
                <>
                  <div className="thread-header">

                    <button
                      type="button"
                      className="thread-back-btn"
                      onClick={closeConversation}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>

                    <div>
                      <h3>{otherName}</h3>

                      <Link to={`/item/${itemId}`}>
                        <Package size={14} /> {itemTitle}
                      </Link>
                    </div>

                  </div>

                  <div className="thread-messages">

                    {messages.length === 0 && (
                      <p className="thread-empty">
                        No messages yet. Write the first one below.
                      </p>
                    )}

                    {messages.map((message) => {

                      const isMine =
                        Number(message.sender_id) === Number(userId);

                      return (
                        <div
                          key={message.id}
                          className={`bubble ${
                            isMine ? "my-bubble" : "their-bubble"
                          }`}
                        >

                          {/* Show replied message */}
                          {message.reply_to &&
                            message.replied_message && (
                              <div className="quoted-message">

                                <div className="quoted-message-label">
                                  <Reply size={13} /> Reply to {message.replied_sender_name}
                                </div>

                                <p>
                                  "{message.replied_message}"
                                </p>

                              </div>
                            )}

                          <p className="message-text">
                            {message.message}
                          </p>

                          <div className="bubble-footer">

                            <span className="message-date">
                              {new Date(
                                message.created_at
                              ).toLocaleString()}
                            </span>

                            {!isMine && (
                              <button
                                type="button"
                                className="bubble-reply-btn"
                                onClick={() => setReplyTo(message)}
                              >
                                <Reply size={13} /> Reply
                              </button>
                            )}

                          </div>

                        </div>
                      );
                    })}

                    <div ref={bottomRef}></div>

                  </div>

                  {/* New message */}
                  <form
                    className="thread-form"
                    onSubmit={handleSend}
                  >

                    {replyTo && (
                      <div className="replying-to-message">

                        <span>
                          Replying to {replyTo.sender_name}:
                        </span>

                        <p>
                          "{replyTo.message}"
                        </p>

                        <button
                          type="button"
                          className="reply-close-btn"
                          onClick={() => setReplyTo(null)}
                        >
                          <X size={14} />
                        </button>

                      </div>
                    )}

                    <div className="thread-form-row">

                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type your message..."
                        rows="2"
                        maxLength={2000}
                      />

                      <button
                        type="submit"
                        className="reply-send-btn"
                        disabled={sending || !text.trim()}
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>

                    </div>

                  </form>
                </>
              )}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Inbox;
