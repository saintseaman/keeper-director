import {
  CloudRain, CloudDrizzle, Wind, CloudLightning, Waves, Flame, Clock, Droplets,
  TreePine, Footprints, Link2, CloudFog, BookOpen, TrainFront, Bell, Snowflake,
  Sun, Mountain, DoorOpen, DoorClosed, Bomb, Crosshair, Zap, Search,
  Lightbulb, KeyRound, ArrowDown, Users, Fish, CircleDot, Bird, Eye,
  Skull, Bug, Ear, Heart, HeartPulse, Megaphone, Music, Wrench,
  Orbit, AlertTriangle, Volume2, Brain, Building,
  Building2, Map, Hexagon, Anchor, Plus, Shield,
  Droplet, Hand, Moon, Undo, Smile, Target, MessageCircle, Star
} from 'lucide-react';

const ICON_MAP = {
  CloudRain, CloudDrizzle, Wind, CloudLightning, Waves, Flame, Clock, Droplets,
  TreePine, Footprints, BookOpen, Bell, Snowflake, Sun, Mountain,
  DoorOpen, DoorClosed, Bomb, Crosshair, Zap, Search,
  Lightbulb, KeyRound, ArrowDown, Users, Fish, CircleDot, Bird, Eye,
  Skull, Bug, Ear, Heart, HeartPulse, Megaphone, Music, Wrench,
  Orbit, AlertTriangle, Volume2, Building, Building2, Map, Hexagon,
  Target, MessageCircle, Star,
  Link: Link2,
  CloudFog,
  Train: TrainFront,
  BrainCircuit: Brain,
  Ship: Anchor,
  Cross: Plus,
  GlassWater: Droplet,
  Grip: Hand,
  Ghost: Moon,
  TreePalm: TreePine,
  Eclipse: Moon,
  Swords: Shield,
  Undo,
  Laugh: Smile,
  Church: Building,
  Cloud: CloudFog,
  Spline: Orbit,
};

export function getIcon(name) {
  return ICON_MAP[name] || Volume2;
}