import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

type TransactionItemProps = {
    category: string;
    description: string;
    amount: string;
    type: 'in' | 'out';
    date: string;
}
interface Transaction {
    id: number;
    description: string;
    category: string;
    amount: number;
    date: string;
    type: 'in' | 'out';
}
type RecentTransactionsProps = {
  data: Transaction[];
}

const imageTransaction = (category: string, type: string) =>{
  switch (category) {
    case "Food":
      return <Image src="/assets/foodCat.png" width={60} height={60} alt="Food Category" className=" rounded-full mr-1" />;
    // case "Utilities":
    //   return "/assets/utilities-category.png";
    // case "Income":
    //   return "/assets/income-category.png";
    // case "Entertainment":
    //   return "/assets/entertainment-category.png";
    case "Transport":
      return <Image src="/assets/transportCat.png" width={60} height={60} alt="Transport Category" className=" rounded-full mr-1" />;
    // case "Others":
    //   return "/assets/others-category.png";
    // default:
    //   return "/assets/default-category.png";
  }
  if (type === "in") {
    return <div className="w-10 h-10 rounded-full mr-4 bg-money-in"></div>;
  } else {
    return <div className="w-10 h-10 rounded-full mr-4 bg-money-out"></div>;
  }
}
const TransactionItem = ({ category, description, amount, type, date }: TransactionItemProps) => (
    <div className="flex justify-between items-center p-4 pl-1 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        {imageTransaction(category, type)}
        <div>
          <p className="font-semibold text-deep-slate">{description}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>
      <p className={`font-semibold ${type === 'in' ? 'text-money-in' : 'text-money-out'}`}>
        {type === 'in' ? '+' : '-'}Rp {amount}
      </p>
    </div>
  );
  

const RecentTransactions = ({ data }: RecentTransactionsProps) => (
  <div className="m-4">
    <h3 className="text-xl font-bold text-deep-slate mb-2">Recent Transactions</h3>
    {data.length === 0 ? (
      <div className="w-full p-6 flex flex-col justify-center items-center ">
        <Image src="/assets/NoTransactionCat.png" alt="No transactions" width={150} height={150} />
        <p className="text-gray-500">No transactions found.</p>
      </div>
    ): (
    <Card className="bg-warm-cream shadow-md border-none">
      <CardContent className="p-0">
        {data.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            category={transaction.category}
            description={transaction.description}
            date={transaction.date}
            amount={Math.abs(transaction.amount).toLocaleString("id-ID")}
            type={transaction.type}
          />
        ))}
      </CardContent>
    </Card>

    )}
  </div>
)


export default RecentTransactions;
