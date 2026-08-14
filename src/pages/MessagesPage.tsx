// src/pages/MessagesPage.tsx
import MessagesPage from '../features/messages/pages/MessagesPage';

type Props = {
  openConversationWith?: string | null;
  onClearOpen?: () => void;
};

export default function Page(props: Props) {
  return <MessagesPage {...props} />;
}