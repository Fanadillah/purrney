import Header from "./component/Header";
import BalanceSummary from "./component/BalanceSummary";
import RecentTransactions from "./component/RecentTransactions";
import FloatingActionButton from "./component/FloatingActionButton";
import BottomNav from "./component/BottomNav";
import UserWelcome from "./component/UserWelcome";
import ProgressBar from "./component/ProgressBar";
import IndexFilterSummary from "./component/IndexFilterSummary";

// Dummy data for demonstration
const user = {
  name: "Purrney",
  avatar: "/assets/user-avatar.png",
}
interface Transaction {
    id: number;
    description: string;
    category: string;
    amount: number;
    date: string;
    type: 'in' | 'out';
}
interface ProgressData {
    id: number;
    category: string;
    amount: number;
    amountMax: number;
    color: string;
}
const data: Transaction[] = [
  // { id: 1, description: "Grocery Shopping", category: "Food", amount: -150000, date: "2024-06-01", type: 'out' },
  // { id: 2, description: "Salary", category: "Income", amount: 5000000, date: "2024-06-01", type: 'in' },
  // { id: 3, description: "Electricity Bill", category: "Utilities", amount: -300000, date: "2024-06-02", type: 'out' },
  // { id: 4, description: "Dinner with Friends", category: "Food", amount: -200000, date: "2024-06-03", type: 'out' },
  // { id: 5, description: "Freelance Project", category:"Income", amount: 2000000, date: "2024-06-04", type: 'in' },
]
const progressData: ProgressData[] = [
  { id: 1, category: "Food", amount: 300000, amountMax: 500000, color: "bg-food" },
  { id: 2, category: "Transport", amount: 200000, amountMax: 300000, color: "bg-transport" },
  { id: 3, category: "Entertainment", amount: 300000, amountMax: 450000, color: "bg-entertainment" },
  { id: 4, category: "Utilities", amount: 455555, amountMax: 655555, color: "bg-utilities" },
  { id: 5, category: "Others", amount: 123456, amountMax: 222222, color: "bg-others" },
]
// end dummy data
const income = data.filter(transaction => transaction.type === 'in').reduce((sum, transaction) => sum + transaction.amount, 0);
const expense = data.filter(transaction => transaction.type === 'out').reduce((sum, transaction) => sum + transaction.amount, 0);
const totalBalance = income - expense;

export default function PurrneyHome() {
  return (
    <div className="bg-app-background min-h-screen font-sans">
      <Header />
      <UserWelcome  name={user.name} />
      <IndexFilterSummary />
      <main className="pb-20">
        <BalanceSummary totalBalance={totalBalance} income={income} expense={expense}/>
        <ProgressBar data={progressData}/>
        <RecentTransactions data={data} />
      </main>
      {/* <FloatingActionButton /> */}
      <BottomNav />
    </div>
  );
}