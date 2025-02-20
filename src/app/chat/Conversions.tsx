import { Conversation } from "@/types/conversation";
import { User } from "@/types/user";

function Conversions(props: {
  conversations: Conversation[];
  setSelectedUser: (user: User) => void;
  selectedUser: User | null;
  setConversation: (conversation: Conversation) => void;
}) {
  return (
    <div>
      <h1>conversations</h1>
      {props.conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => {
            props.setSelectedUser(conversation.user);
            props.setConversation(conversation);
          }}
          style={{
            cursor: "pointer",
            backgroundColor:
              props.selectedUser?.id === conversation.user.id
                ? "lightgray"
                : "white",
          }}
        >
          {conversation.user.name}
        </div>
      ))}
    </div>
  );
}

export default Conversions;
