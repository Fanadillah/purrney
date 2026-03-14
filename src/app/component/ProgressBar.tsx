import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProgressBarProps = {
    category: string;
    amount: number;
    amountMax: number;
    color: string;
}
type CardProgress = {
    id: number;
    category: string;
    amount: number;
    amountMax: number;
    color: string;
}
type ProgressBarComponentProps = {
    data: CardProgress[];
}

const calculatedPercentage = (amount: number, amountMax: number) => {
    if (amountMax === 0) return 0;
    return Math.round((amount / amountMax) * 100);
}
const colorProgress = (amount:number, amountMax: number) => {
    if (calculatedPercentage(amount, amountMax) >= 0 && calculatedPercentage(amount, amountMax) < 50) {
        return "bg-green-500";
    } else if (calculatedPercentage(amount, amountMax) >= 50 && calculatedPercentage(amount, amountMax) < 80) {
        return "bg-yellow-500";
    } else {
        return "bg-red-500";
    }
}

const CardProgress = ({category, amount, amountMax, color}: ProgressBarProps) => (
        <div className="min-w-62 sm:min-w-75 md:min-w-87.5 p-2 bg-warm-cream shadow-md rounded-md scroll-snap-start">
        <div className="flex justify-between items-center ">
        <h2 className=" font-bold text-deep-slate mb-2">{category}</h2>
        <p className="text-sm font-semibold text-deep-slate">{calculatedPercentage(amount, amountMax)}%</p>
        </div>
        <Progress value={calculatedPercentage(amount, amountMax)} className="h-2 rounded-full bg-soft-orange/30">
  {/* <div 
    className="h-2 rounded-full bg-soft-orange" // warna progress
    style={{ width: `${calculatedPercentage(amount, amountMax)}%` }}
  /> */}

        </Progress>
        <div className="mt-2 flex justify-between items-center">
        <p className="text-sm text-deep-slate">Rp {amount.toLocaleString("id-ID")}</p>
        <p className="text-sm text-deep-slate">Rp {amountMax.toLocaleString("id-ID")}
        </p>

        </div>
    </div>
)
const ProgressBar = ({data}: ProgressBarComponentProps) => (
    <div className="m-4 mt-0 p-4">
        <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-deep-slate mb-1">My Budgets</h2>
        <a href="">View All</a>

        </div>

        <div className="flex overflow-x-auto flex-nowrap  items-center gap-5 w-full scroll-snap-x scroll-snap-mandatory scrollbar-hide">



        {/* card progress */}
        {data.map((cardProgress) => (
            <CardProgress 
            key={cardProgress.id} 
            category={cardProgress.category}
            amount={cardProgress.amount}
            amountMax={cardProgress.amountMax}
            color={cardProgress.color}
            />
        ))}

        {/* <div className="min-w-62 sm:min-w-75 md:min-w-87.5 p-2 bg-warm-cream shadow-md rounded-md scroll-snap-start">
        <div className="flex justify-between items-center ">
        <h2 className=" font-bold text-deep-slate mb-2">Monthly Savings Goal</h2>
        <p className="text-sm font-semibold text-deep-slate">75%</p>
        </div>
        <Progress value={75} className="h-2 rounded-full bg-soft-orange/30" />
        <p className="text-sm text-deep-slate mt-2">Rp 750.000 of Rp 1.000.000 saved</p>
    </div> */}
        {/* end card progress */} 
        {/* card progress */}
        {/* <div className="min-w-62 sm:min-w-75 md:min-w-87.5 p-2 bg-warm-cream shadow-md rounded-md scroll-snap-start">
        <div className="flex justify-between items-center ">
        <h2 className=" font-bold text-deep-slate mb-2">Monthly Savings Goal</h2>
        <p className="text-sm font-semibold text-deep-slate">75%</p>
        </div>
        <Progress value={75} className="h-2 rounded-full bg-soft-orange/30" />
        <p className="text-sm text-deep-slate mt-2">Rp 750.000 of Rp 1.000.000 saved</p>
    </div> */}
        {/* end card progress */}  
        {/* card progress */}
        {/* <div className="min-w-62 sm:min-w-75 md:min-w-87.5 p-2 bg-warm-cream shadow-md rounded-md scroll-snap-start">
        <div className="flex justify-between items-center ">
        <h2 className=" font-bold text-deep-slate mb-2">Monthly Savings Goal</h2>
        <p className="text-sm font-semibold text-deep-slate">75%</p>
        </div>
        <Progress value={75} className="h-2 rounded-full bg-soft-orange/30" />
        <p className="text-sm text-deep-slate mt-2">Rp 750.000 of Rp 1.000.000 saved</p>
    </div> */}
        {/* end card progress */}

        </div>
    </div>
    
)

export default ProgressBar;