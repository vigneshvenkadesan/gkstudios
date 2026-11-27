import {
  Baby,
  BriefcaseBusiness,
  Cake,
  Camera,
  Heart,
  Mountain,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

interface EventTypeIconProps {
  name?: string;
  category?: string;
  className?: string;
}

export function EventTypeIcon({
  name = '',
  category = '',
  className = 'h-4 w-4',
}: EventTypeIconProps) {
  const eventText = `${name} ${category}`.toLowerCase();
  let Icon: LucideIcon = Camera;

  if (/birthday/.test(eventText)) {
    Icon = Cake;
  } else if (/baby|kid|child|maternity|newborn|seemantham/.test(eventText)) {
    Icon = Baby;
  } else if (/wedding|marriage|engagement/.test(eventText)) {
    Icon = Heart;
  } else if (/outdoor|shoot|portrait/.test(eventText)) {
    Icon = Mountain;
  } else if (/family|anniversary|milestone|traditional ceremony/.test(eventText)) {
    Icon = UsersRound;
  } else if (/corporate|business|company/.test(eventText)) {
    Icon = BriefcaseBusiness;
  }

  return <Icon aria-hidden="true" className={className} />;
}
