import { Badge } from "@/components/ui/badge";

const categories = ["All", "Technology", "Business", "Entertainment", "Sports", "Education"];

interface EventFiltersProps {
  activeCategory: string;
  setCategory: (category: string) => void;
}

export function EventFilters({ activeCategory, setCategory }: EventFiltersProps) {
  return (
    <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Badge
          key={category}
          variant={category === activeCategory ? "default" : "secondary"}
          className="cursor-pointer"
          onClick={() => setCategory(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
}