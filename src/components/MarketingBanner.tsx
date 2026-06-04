export default function MarketingBanner() {
    return (
      <div className="p-4">
        <div className="rounded-3xl bg-linear-to-r from-blue-900 to-blue-700 p-6 flex items-center justify-between shadow-lg text-white">
          <div className='flex-1 pr-4'>
            <h3 className='font-bold text-lg mb-1'>TENN Credit</h3>
            <p className="text-sm opacity-90 mb-4">Smart Loans. Made Simple. Fast, secure & fully digital.</p>
            <button className="text-sm font-semibold px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100">Download Now</button>
          </div>
          <div className='w-24 h-24 rounded-full bg-gray-400 overflow-hidden'>
            {/* Placeholder for the person image */}
            <div className='w-full h-full bg-gray-300'></div>
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>
      </div>
    );
  }
  
