import Header from "./component/Header";
import BalanceSummary from "./component/BalanceSummary";
import RecentTransactions from "./component/RecentTransactions";
import FloatingActionButton from "./component/FloatingActionButton";
import BottomNav from "./component/BottomNav";
import UserWelcome from "./component/UserWelcome";
import ProgressBar from "./component/ProgressBar";
import IndexFilterSummary from "./component/IndexFilterSummary";
import QuickMenu from "./component/QuickMenu";
import {user} from "../lib/db";
import {data} from "../lib/db";
import {progressData} from "../lib/db";

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
        <QuickMenu />
        <ProgressBar data={progressData}/>
        <RecentTransactions data={data} />
      </main>
      {/* <FloatingActionButton /> */}
      <BottomNav />
    </div>
  );
}