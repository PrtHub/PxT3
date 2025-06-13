import {
  Brain,
  Cloud,
  Cpu,
  Gem,
  Key,
  Laptop,
  Lightbulb,
  Orbit,
  Palette,
  Rocket,
  Sparkles,
  Sun,
  Wind,
  Zap,
} from "lucide-react";

const MODEL_ICONS = [
  {
    match: ["gemini"],
    icon: Gem,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    match: ["gemma"],
    icon: Gem,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    match: ["claude"],
    icon: Brain,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    match: ["openai", "gpt"],
    icon: Sparkles,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    match: ["deepseek"],
    icon: Rocket,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    match: ["qwen"],
    icon: Cloud,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    match: ["mistral"],
    icon: Wind,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    match: ["llama", "lama"],
    icon: Lightbulb,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    match: ["command"],
    icon: Zap,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    match: ["phi"],
    icon: Orbit,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    match: ["mixtral"],
    icon: Cpu,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    match: ["stable-diffusion", "sdxl"],
    icon: Palette,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
  },
  {
    match: ["dall-e"],
    icon: Sun,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    match: ["codellama"],
    icon: Laptop,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
] as const;

 const getModelIcon = (modelId: string) => {
  const modelIdLower = modelId.toLowerCase();

  const iconConfig = MODEL_ICONS.find((config) =>
    config.match.some((keyword) => modelIdLower.includes(keyword))
  );

  const {
    icon: Icon,
    color,
    bg,
  } = iconConfig || {
    icon: Key,
    color: "text-gray-500",
    bg: "bg-gray-500/10",
  };

  return (
    <span className={`p-1 rounded-md ${bg} ${color}`}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
};

export default getModelIcon;

