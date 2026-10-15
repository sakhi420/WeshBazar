import {
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Car,
  Dumbbell,
  Gamepad2,
  HeartPulse,
  Home,
  KeyRound,
  Laptop,
  Leaf,
  Milk,
  Package,
  PawPrint,
  Plug,
  Shirt,
  Smartphone,
  Sofa,
  Stethoscope,
  Store,
  Tablet,
  ToyBrick,
  Tractor,
  TreePine,
  Tv,
  Watch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps the backend category `iconKey` (see prisma/seed/taxonomy.data.ts) to a
 * light line icon. Unknown keys fall back to a neutral marketplace glyph. Keep
 * this list in sync with the seed values.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  bicycle: Bike,
  book: BookOpen,
  box: Package,
  briefcase: Briefcase,
  car: Car,
  cow: Milk,
  dumbbell: Dumbbell,
  gamepad: Gamepad2,
  'heart-pulse': HeartPulse,
  home: Home,
  key: KeyRound,
  laptop: Laptop,
  leaf: Leaf,
  motorcycle: Bike,
  paw: PawPrint,
  plug: Plug,
  shirt: Shirt,
  smartphone: Smartphone,
  sofa: Sofa,
  stethoscope: Stethoscope,
  store: Store,
  tablet: Tablet,
  toy: ToyBrick,
  tractor: Tractor,
  tree: TreePine,
  tv: Tv,
  watch: Watch,
  wrench: Wrench,
};

/** Resolve a category icon by backend `iconKey`, with a safe neutral fallback. */
export function categoryIcon(iconKey: string | null): LucideIcon {
  return (iconKey && CATEGORY_ICONS[iconKey]) || Package;
}