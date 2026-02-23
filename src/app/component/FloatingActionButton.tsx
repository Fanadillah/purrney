import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const FloatingActionButton = () => (
  <Button className="fixed bottom-20 right-5 bg-soft-orange text-white p-2 rounded-full shadow-lg h-16 w-16">
    <Plus size={40} />
  </Button>
);

export default FloatingActionButton;
