import { Card, CardDescription, } from "@/components/ui/card";
import Image from "next/image";

const QuickMenu = () => (
    <div className="m-3 mb-0 mt-1 p-3">
    <div>
        <h2 className="text-xl font-bold text-deep-slate mb-1">Quick Menu</h2>
    </div>
    <div className="flex mt-3 gap-4 w-full justify-between items-center">
        <a href="/goals" className="flex items-center p-4 py-1 w-full bg-warm-cream hover:bg-amber-500 hover:text-amber-50 active:bg-amber-500 active:text-amber-50 shadow-lg rounded-2xl">
            <Image src="/assets/goalsCat.png" alt="Goals" width={60} height={60} />
            <h2 className="font-bold">Goals</h2>
        </a>
        <a href="/budget" className="flex items-center p-4 py-1 w-full bg-warm-cream hover:bg-amber-500 hover:text-amber-50 active:bg-amber-500 active:text-amber-50 shadow-lg rounded-2xl">
            <Image src="/assets/budgetCat.png" alt="Budget" width={60} height={60} />
            <h2 className="font-bold">Budget</h2>
        </a>
    </div>
    </div>
)

export default QuickMenu;