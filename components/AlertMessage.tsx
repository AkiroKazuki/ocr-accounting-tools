import React from 'react';

interface AlertMessageProps {
     message: string;
     type: 'error' | 'warning' | 'info' | 'success';
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
     </svg>
);

const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
     </svg>
);


export const AlertMessage: React.FC<AlertMessageProps> = ({ message, type }) => {
     let bgColor = 'bg-sky-600';
     let borderColor = 'border-sky-700';
     let textColor = 'text-sky-100';
     let IconComponent = InfoIcon;

     switch (type) {
          case 'error':
               bgColor = 'bg-rose-700';
               borderColor = 'border-rose-800';
               textColor = 'text-rose-100';
               IconComponent = ErrorIcon;
               break;
          case 'warning':
               bgColor = 'bg-amber-600';
               borderColor = 'border-amber-700';
               textColor = 'text-amber-100';
               IconComponent = ErrorIcon; // Using error icon for warning too for simplicity
               break;
          case 'success':
               bgColor = 'bg-emerald-600';
               borderColor = 'border-emerald-700';
               textColor = 'text-emerald-100';
               break;
     }

     return (
          <div
               className={`p-4 border-l-4 ${borderColor} ${bgColor} ${textColor} rounded-r-md shadow-md flex items-start space-x-3`}
               role="alert"
          >
               <IconComponent className={`flex-shrink-0 ${textColor}`} />
               <p className="text-sm">{message}</p>
          </div>
     );
};
