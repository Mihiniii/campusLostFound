import { useEffect, useRef, useState } from "react";

function Inbox() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reply states
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Message references for smooth scrolling
  const messageRefs = useRef({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/get-messages.php?user_id=${user.id}`
        );

        const data = await response.json();

        if (data.success) {
          setMessages(data.messages);

          await fetch("http://localhost:8000/api/mark-messages-read.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
            }),
          });
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  // Send reply
  const handleReply = async () => {
    if (!replyText.trim() || !replyTo) {
      return;
    }

    setSendingReply(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/send-message.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: user.id,
            receiver_id: replyTo.sender_id,
            item_id: replyTo.item_id,
            message: replyText.trim(),
            reply_to: replyTo.id,
          }),
        }
      );

      const data = await response.json();

      console.log("SEND REPLY RESPONSE:", data);

      if (data.success) {
        setReplyText("");
        setReplyTo(null);

        // Reload messages
        const messagesResponse = await fetch(
          `http://localhost:8000/api/get-messages.php?user_id=${user.id}`
        );

        const messagesData = await messagesResponse.json();

        if (messagesData.success) {
          setMessages(messagesData.messages);
        }

        alert("Reply sent successfully!");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Failed to send reply.");
    } finally {
      setSendingReply(false);
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

  return (
    <div className="messages-page">

      <div className="messages-container">

        <div className="messages-header">
          <h1>📩 Messages</h1>
          <p>Your conversations about lost and found items.</p>
        </div>

        {messages.length === 0 ? (

          <div className="messages-empty">

            <div className="messages-empty-icon">
              💬
            </div>

            <h3>No messages yet</h3>

            <p>
              When someone contacts you about an item,
              your messages will appear here.
            </p>

          </div>

        ) : (

          <div className="messages-list">

            {messages.map((message) => {

              const isReceived =
                Number(message.receiver_id) === Number(user.id);

              const otherUser = isReceived
                ? message.sender_name
                : message.receiver_name;

              const isReplyTarget =
                replyTo?.id === message.id;

              return (
                <div
                  ref={(el) => {
                    messageRefs.current[message.id] = el;
                  }}
                  className={`message-card ${
                    isReceived
                      ? "received-message"
                      : "sent-message"
                  } ${
                    isReplyTarget
                      ? "reply-target-message"
                      : ""
                  }`}
                  key={message.id}
                >

                  <div className="message-card-top">

                    <div>

                      <h3>
                        {otherUser}
                      </h3>

                      <span className="message-direction">
                        {isReceived
                          ? "Received"
                          : "Sent"}
                      </span>

                    </div>

                    <span className="message-date">
                      {new Date(
                        message.created_at
                      ).toLocaleString()}
                    </span>

                  </div>

                  <div className="message-item">
                    📦 {message.item_title}
                  </div>

                  {/* Show replied message */}
                  {message.reply_to &&
                    message.replied_message && (
                      <div className="quoted-message">

                        <div className="quoted-message-label">
                          ↩ Reply to {message.replied_sender_name}
                        </div>

                        <p>
                          "{message.replied_message}"
                        </p>

                      </div>
                    )}

                  {/* Current message */}
                  <p className="message-text">
                    {message.message}
                  </p>

                  {/* Reply button */}
                  {isReceived && !isReplyTarget && (
                    <button
                      type="button"
                      className="reply-btn"
                      onClick={() => {

                        setReplyTo(message);
                        setReplyText("");

                        setTimeout(() => {
                          messageRefs.current[
                            message.id
                          ]?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 100);

                      }}
                    >
                      ↩ Reply
                    </button>
                  )}

                  {/* Reply form directly below selected message */}
                  {isReplyTarget && (
                    <div className="reply-form-inline">

                      <div className="reply-form-header">
                        <h3>
                          Reply to {replyTo.sender_name}
                        </h3>

                        <button
                          type="button"
                          className="reply-close-btn"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText("");
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="replying-to-message">

                        <span>
                          Replying to:
                        </span>

                        <p>
                          "{replyTo.message}"
                        </p>

                        <small>
                          {new Date(
                            replyTo.created_at
                          ).toLocaleString()}
                        </small>

                      </div>

                      <textarea
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(e.target.value)
                        }
                        placeholder="Type your reply..."
                        rows="4"
                        autoFocus
                      />

                      <div className="reply-actions">

                        <button
                          type="button"
                          className="reply-cancel-btn"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="reply-send-btn"
                          onClick={handleReply}
                          disabled={
                            sendingReply ||
                            !replyText.trim()
                          }
                        >
                          {sendingReply
                            ? "Sending..."
                            : "Send Reply"}
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}

export default Inbox;
