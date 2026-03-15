
// Dummy data for demonstration
const user = {
  name: "Ilham",
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
  { id: 1, description: "Grocery Shopping", category: "Food", amount: -150000, date: "2024-06-01", type: 'out' },
  { id: 2, description: "Salary", category: "Income", amount: 5000000, date: "2024-06-01", type: 'in' },
  { id: 3, description: "Electricity Bill", category: "Utilities", amount: -300000, date: "2024-06-02", type: 'out' },
  { id: 4, description: "Dinner with Friends", category: "Food", amount: -200000, date: "2024-06-03", type: 'out' },
  { id: 5, description: "Freelance Project", category:"Income", amount: 2000000, date: "2024-06-04", type: 'in' },
  { id: 6, description: "Movie Night", category: "Entertainment", amount: -100000, date: "2024-06-05", type: 'out' },
  { id: 7, description: "Bus Pass", category: "Transport", amount: -50000, date: "2024-06-06", type: 'out' },
  { id: 8, description: "Gym Membership", category: "Others", amount: -250000, date: "2024-06-07", type: 'out' },
]

const amountMaxCategories: { [key: string]: number } = {
    "Food": 500000,
    "Utilities": 1000000,
    // "Income": 10000000,
    "Entertainment": 400000,
    "Transport": 200000,
    "Others": 500000,
}
const colorCategories: { [key: string]: string } = {
    "Food": "bg-food",
    "Utilities": "bg-utilities",
    // "Income": "bg-income",
    "Entertainment": "bg-entertainment",
    "Transport": "bg-transport",
    "Others": "bg-others",
}

const progressData: ProgressData[] = Object.keys(amountMaxCategories).map((category, idx) => {
  // ambil semua transaksi sesuai kategori
  const transactionsForCategory = data.filter(t => t.category === category);

  // jumlahkan amount (kalau kosong hasilnya 0)
  const totalAmount = transactionsForCategory.reduce((sum, t) => sum + t.amount, 0);

  return {
    id: idx + 1,
    category,
    amount: Math.abs(totalAmount), // bisa negatif, nanti di UI progress bar tinggal ambil Math.abs
    amountMax: amountMaxCategories[category],
    color: colorCategories[category]
  };
});
// const progressData: ProgressData[] = [
//   { id: 1, category: "Food", amount: 300000, amountMax: 500000, color: "bg-food" },
//   { id: 2, category: "Transport", amount: 200000, amountMax: 300000, color: "bg-transport" },
//   { id: 3, category: "Entertainment", amount: 300000, amountMax: 450000, color: "bg-entertainment" },
//   { id: 4, category: "Utilities", amount: 455555, amountMax: 655555, color: "bg-utilities" },
//   { id: 5, category: "Others", amount: 123456, amountMax: 222222, color: "bg-others" },
// ]

const accounts = [
  {name: "Cash", balance: 500000},
  {name: "BCA", balance: 1500000},
  {name: "BRI", balance: 2000000},
  {name: "Mandiri", balance: 3500000},
  {name: "Gopay", balance: 500000},
  {name: "OVO", balance: 1000000},
  {name: "DANA", balance: 750000},
  {name: "ShopeePay", balance: 1250000},
];

const categories = [
  { value: "Income", label: "💰 Income" },
  { value: "Food", label: "🍜 Food" },
  { value: "Transport", label: "🚗 Transport" },
  { value: "Entertainment", label: "🎮 Entertainment" },
  { value: "Utilities", label: "💡 Utilities" },
  { value: "Others", label: "📦 Others" },
  { value: "Shopping", label: "🛍️ Shopping" },
  { value: "Education", label: "📚 Education" },
  { value: "Health", label: "🏥 Health" },
];
// end dummy data

export { user, data, progressData, accounts, categories }