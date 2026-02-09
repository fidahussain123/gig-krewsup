import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

const StyledMaterialIcon = cssInterop(MaterialIcons, {
  className: 'style',
});

const iconMap: Record<string, string> = {
  arrow_back_ios_new: 'arrow-back-ios-new',
  arrow_forward: 'arrow-forward',
  calendar_today: 'calendar-today',
  calendar_month: 'calendar-today',
  check_circle: 'check-circle',
  chevron_right: 'chevron-right',
  fact_check: 'fact-check',
  location_on: 'location-on',
  near_me: 'near-me',
  person_search: 'person-search',
  verified_user: 'verified-user',
  add_a_photo: 'add-a-photo',
  account_balance_wallet: 'account-balance-wallet',
};

type IconProps = React.ComponentProps<typeof MaterialIcons> & {
  className?: string;
};

const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
  const resolvedName = iconMap[String(name)] ?? String(name);
  return <StyledMaterialIcon name={resolvedName as any} className={className} {...props} />;
};

export default Icon;
