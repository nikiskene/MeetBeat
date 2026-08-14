// src/pages/ExplorePage.tsx
import ExplorePage from '../features/discovery/pages/ExplorePage';

type Props = {
  onMatch?: (matchedUserId: string) => void;
};

export default function Page(props: Props) {
  return <ExplorePage {...props} />;
}