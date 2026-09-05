/**
 * Bjet Mobile - CategoryIcon Component (Phase 9)
 * Renders an icon corresponding to a category's icon identifier string.
 */
import React from 'react';
import {
  Utensils,
  ShoppingBasket,
  ShoppingBag,
  ShoppingCart,
  Car,
  Bus,
  TrainFront,
  Plane,
  Zap,
  Film,
  Tv,
  Gamepad2,
  Music,
  Heart,
  Activity,
  Stethoscope,
  GraduationCap,
  BookOpen,
  Sparkles,
  Smile,
  MoreHorizontal,
  CircleHelp,
  Tag,
  Briefcase,
  Wallet,
  CreditCard,
  CircleDollarSign,
  House,
  Coffee,
  Gift,
  Phone,
  Shield,
  Wrench,
  Wifi,
  LucideProps,
} from 'lucide-react-native';

interface CategoryIconProps extends LucideProps {
  name: string | null | undefined;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 20,
  color = '#FFFFFF',
  ...props
}) => {
  const iconKey = (name || '').toLowerCase().trim();

  switch (iconKey) {
    case 'utensils':
      return <Utensils size={size} color={color} {...props} />;
    case 'coffee':
      return <Coffee size={size} color={color} {...props} />;
    case 'shopping-basket':
      return <ShoppingBasket size={size} color={color} {...props} />;
    case 'shopping-bag':
      return <ShoppingBag size={size} color={color} {...props} />;
    case 'shopping-cart':
      return <ShoppingCart size={size} color={color} {...props} />;
    case 'car':
      return <Car size={size} color={color} {...props} />;
    case 'bus':
      return <Bus size={size} color={color} {...props} />;
    case 'train':
      return <TrainFront size={size} color={color} {...props} />;
    case 'plane':
      return <Plane size={size} color={color} {...props} />;
    case 'bolt':
    case 'zap':
      return <Zap size={size} color={color} {...props} />;
    case 'film':
      return <Film size={size} color={color} {...props} />;
    case 'tv':
      return <Tv size={size} color={color} {...props} />;
    case 'gamepad-2':
    case 'gamepad':
      return <Gamepad2 size={size} color={color} {...props} />;
    case 'music':
      return <Music size={size} color={color} {...props} />;
    case 'heart':
      return <Heart size={size} color={color} {...props} />;
    case 'activity':
      return <Activity size={size} color={color} {...props} />;
    case 'stethoscope':
      return <Stethoscope size={size} color={color} {...props} />;
    case 'graduation-cap':
      return <GraduationCap size={size} color={color} {...props} />;
    case 'book':
      return <BookOpen size={size} color={color} {...props} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} {...props} />;
    case 'smile':
      return <Smile size={size} color={color} {...props} />;
    case 'ellipsis-h':
    case 'more-horizontal':
      return <MoreHorizontal size={size} color={color} {...props} />;
    case 'question-circle':
      return <CircleHelp size={size} color={color} {...props} />;
    case 'briefcase':
      return <Briefcase size={size} color={color} {...props} />;
    case 'wallet':
      return <Wallet size={size} color={color} {...props} />;
    case 'credit-card':
      return <CreditCard size={size} color={color} {...props} />;
    case 'dollar-sign':
      return <CircleDollarSign size={size} color={color} {...props} />;
    case 'home':
    case 'house':
      return <House size={size} color={color} {...props} />;
    case 'gift':
      return <Gift size={size} color={color} {...props} />;
    case 'phone':
      return <Phone size={size} color={color} {...props} />;
    case 'shield':
      return <Shield size={size} color={color} {...props} />;
    case 'wrench':
    case 'tool':
      return <Wrench size={size} color={color} {...props} />;
    case 'wifi':
      return <Wifi size={size} color={color} {...props} />;
    case 'tag':
    default:
      return <Tag size={size} color={color} {...props} />;
  }
};
