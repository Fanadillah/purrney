import { Filter } from "lucide-react";

const IndexFilterSummary = () => {
    return (
        <div className="p-1 pl-4  border-none  space-x-1 gap-1 flex items-center justify-start">
            <button className="p-2 border-2 rounded-full text-xs text-deep-slate border-soft-orange shadow-sm flex items-center justify-center">
                    <Filter className="w-4 h-4" />
            </button>

            <a className="p-2 border-2 rounded-full text-xs text-deep-slate border-soft-orange shadow-sm active">
                    This Week
            </a>
            <a className="p-2 border-2 rounded-full text-xs text-deep-slate shadow-sm border-soft-orange">
                    This Month
            </a>
            <a className="p-2 border-2 rounded-full text-xs text-deep-slate border-soft-orange">
                    This Year
            </a>
        </div>
    );
}

export default IndexFilterSummary;