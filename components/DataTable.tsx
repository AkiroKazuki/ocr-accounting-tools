import React from 'react';

interface DataTableProps {
     data: string[][]; // Array of rows, where each row is an array of cell strings
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
     if (!data || data.length === 0) {
          return <p className="text-slate-400 italic">No data to display in table format.</p>;
     }

     // Assuming the first row might be headers
     const headers = data[0];
     const bodyRows = data.slice(1);

     return (
          <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-inner">
               <table className="min-w-full divide-y divide-slate-700">
                    {headers && headers.length > 0 && (
                         <thead className="bg-slate-700/50">
                              <tr>
                                   {headers.map((header, index) => (
                                        <th
                                             key={index}
                                             scope="col"
                                             className="px-4 py-3 text-left text-xs font-semibold text-sky-300 uppercase tracking-wider"
                                        >
                                             {header.trim() === '' ? `Column ${index + 1}` : header}
                                        </th>
                                   ))}
                              </tr>
                         </thead>
                    )}
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                         {(headers && headers.length > 0 ? bodyRows : data).map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-slate-700/70 transition-colors">
                                   {row.map((cell, cellIndex) => (
                                        <td
                                             key={cellIndex}
                                             className="px-4 py-3 whitespace-nowrap text-sm text-slate-300"
                                        >
                                             {cell}
                                        </td>
                                   ))}
                              </tr>
                         ))}
                         {data.length === 1 && headers && headers.length > 0 && ( // Only headers, no data rows
                              <tr>
                                   <td colSpan={headers.length} className="px-4 py-3 text-center text-sm text-slate-500 italic">No data rows found below headers.</td>
                              </tr>
                         )}
                    </tbody>
               </table>
          </div>
     );
};
