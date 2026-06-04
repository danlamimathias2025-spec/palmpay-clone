import { ArrowLeftRight, Clapperboard, Lightbulb, Smartphone, Target, Tv, Zap, Gift } from 'lucide-react';

const services = [
  { name: 'Add Funds', icon: <ArrowLeftRight size={24} className="text-green-500" />, badge: 'Max 3.0%' },
  { name: 'Transfer', icon: <ArrowLeftRight size={24} className="text-blue-500" />, badge: 'Max 3.0%' },
  { name: 'Airtime', icon: <Smartphone size={24} className="text-blue-500" />, badge: 'Max 3.0%' },
  { name: 'Data', icon: <Smartphone size={24} className="text-blue-500" />, badge: 'Max 3.0%' },
  { name: 'TV', icon: <Tv size={24} className="text-red-500" />, badge: 'Max 1.5%' },
  { name: 'Gaming', icon: <Target size={24} className="text-purple-500" />, badge: 'Max 0.5%' },
  { name: 'Electricity', icon: <Lightbulb size={24} className="text-yellow-500" />, badge: 'Max 1.0%' },
  { name: 'Coupon', icon: <Gift size={24} className="text-orange-500" />, badge: 'Claim' },
];

export default function ServicesGrid({ onTransfer, onAddFunds, onAirtime, onData, onCoupon }: { onTransfer: () => void, onAddFunds: () => void, onAirtime: () => void, onData: () => void, onCoupon: () => void }) {
  const handleClick = (name: string) => {
    switch(name) {
        case 'Transfer': onTransfer(); break;
        case 'Add Funds': onAddFunds(); break;
        case 'Airtime': onAirtime(); break;
        case 'Data': onData(); break;
        case 'Coupon': onCoupon(); break;
    }
  }

  return (
    <div className="p-4 grid grid-cols-4 gap-4">
      {services.map((service, index) => (
        <div key={index} className="flex flex-col items-center" onClick={() => handleClick(service.name)}>
            <div className='relative'>
                <span className='absolute -top-3 left-1 text-[8px] font-bold text-white bg-blue-600 px-1 rounded-full whitespace-nowrap'>{service.badge}</span>
                <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-2 border border-gray-100 dark:border-gray-800">
                    {service.icon}
                </div>
            </div>
          <p className="text-xs text-gray-700 dark:text-gray-200 text-center font-medium">{service.name}</p>
        </div>
      ))}
    </div>
  );
}
