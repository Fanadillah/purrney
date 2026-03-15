"use client"
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Card } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";

type userProps = {
  name: string;
}


const UserWelcome: React.FC<userProps> = ({ name }) => {

  const [visible, setVisible] = useState(true);

  if (!visible) return null;
  return (
  <div className="m-4 border-none flex justify-between items-center">
    <div className="flex gap-4 pl-0">
    <div className="pr-0 pl-0">
        <Image src="/assets/welcome-cat.png" width={70} height={70} alt="Welcome Cat" className="w-full h-auto pr-2 object-cover rounded-b-md" />
    </div>
      <div className="bg-warm-cream shadow-xl rounded-lg relative p-4">
        <div className="absolute  w-0 h-0
    border-r-[7vw] border-r-warm-cream
    border-t-[3vh] border-t-transparent
    border-b-[3vh] border-b-transparent  right-56 top-0"></div>
    <button onClick={() => setVisible(false)} 
      className="absolute -top-2 -right-1 text-deep-slate bg-white opacity-30 rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-gray-200">
        ✕
    </button>
      <CardTitle className="text-lg text-deep-slate">Hello {name}</CardTitle>
      <CardDescription className="text-sm text-deep-slate">Here's a summary of your finances.</CardDescription>
      </div>
    </div>
  </div>
)};

export default UserWelcome;