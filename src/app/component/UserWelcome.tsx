import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Card } from "@/components/ui/card";
import Image from "next/image";

type userProps = {
  name: string;
}
const UserWelcome: React.FC<userProps> = ({ name }) => {
  return (
  <Card className="m-4 bg-warm-cream shadow-md border-none flex justify-between items-center">
    <div className="flex gap-4 pl-4">
      <div>
      <CardTitle className="text-lg text-deep-slate">Hello {name}</CardTitle>
      <CardDescription className="text-sm text-deep-slate">Here's a summary of your finances.</CardDescription>
      </div>
    </div>
    <CardContent className="pr-0">
        <Image src="/assets/welcome-cat.png" width={70} height={70} alt="Welcome Cat" className="w-full h-auto pr-2 object-cover rounded-b-md" />
    </CardContent>
  </Card>
)};

export default UserWelcome;