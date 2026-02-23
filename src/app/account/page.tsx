import BottomNav from "../component/BottomNav"

export default function AccountPage() {
    return(
        <div className="p-4">
            <h1 className="text-2xl font-bold text-deep-slate mb-4">My <span className="text-soft-orange">Account</span></h1>
            <p className="text-gray-600">This is the account page. Here you can view your account details and manage your settings.</p>
            <BottomNav />
        </div>
    )
}