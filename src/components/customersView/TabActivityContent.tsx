import React from 'react'
import { FiCheck, FiCheckCircle, FiEye, FiMoreHorizontal, FiMoreVertical, FiX, FiShoppingCart, FiPackage, FiEdit, FiDollarSign } from 'react-icons/fi'
import { Customer } from '@/services/customerService';

interface TabActivityContentProps {
    customer?: Customer | null;
}

// Sample customer activity data
const getCustomerActivityData = (customer: Customer | null | undefined) => {
    if (!customer) return [];
    
    return [
        { text: `Order #ORD-001 placed for ${customer.customerName}`, date: '15 Jan, 2024 10:30 AM', icon: <FiShoppingCart /> },
        { text: `Customer information updated for ${customer.customerName}`, date: '12 Jan, 2024 02:15 PM', icon: <FiEdit /> },
        { text: `Payment received from ${customer.customerName} - Invoice #INV-001`, date: '10 Jan, 2024 09:45 AM', icon: <FiDollarSign /> },
        { text: `Order #ORD-002 processed for ${customer.customerName}`, date: '08 Jan, 2024 11:20 AM', icon: <FiPackage /> },
        { text: `Customer discount updated to ${customer.discount}% for ${customer.customerName}`, date: '05 Jan, 2024 03:00 PM', icon: <FiEdit /> },
        { text: `New order placed by ${customer.customerName}`, date: '03 Jan, 2024 01:30 PM', icon: <FiShoppingCart /> },
    ];
};

const getLogData = () => [
    { browser: 'Chrome on Windows', ip: '192.168.1.100', time: '15 Jan, 2024 10:30 AM', action: 'success' },
    { browser: 'Safari on iOS', ip: '192.168.1.101', time: '12 Jan, 2024 02:15 PM', action: 'success' },
    { browser: 'Firefox on Windows', ip: '192.168.1.102', time: '10 Jan, 2024 09:45 AM', action: 'success' },
    { browser: 'Chrome on Android', ip: '192.168.1.103', time: '08 Jan, 2024 11:20 AM', action: 'success' },
    { browser: 'Chrome on Windows', ip: '192.168.1.100', time: '05 Jan, 2024 03:00 PM', action: 'success' },
    { browser: 'Edge on Windows', ip: '192.168.1.104', time: '03 Jan, 2024 01:30 PM', action: 'success' },
];


const TabActivityContent: React.FC<TabActivityContentProps> = ({ customer }) => {
    const activityData = getCustomerActivityData(customer);
    const logData = getLogData();
    
    return (
        <div className="tab-pane fade" id="activityTab" role="tabpanel">
            <div className="recent-activity p-4 pb-0">
                <div className="mb-4 pb-2 d-flex justify-content-between">
                    <h5 className="fw-bold">Recent Activity:</h5>
                    <a href="#" className="btn btn-sm btn-light-brand">View All</a>
                </div>
                <ul className="list-unstyled activity-feed">
                    {activityData.map((item, index) => (
                        <li key={index} className="activity-item d-flex align-items-start mb-3">
                            <div className="activity-icon me-3">
                                <div className="avatar avatar-sm bg-light-primary">
                                    {item.icon}
                                </div>
                            </div>
                            <div className="activity-content flex-grow-1">
                                <p className="mb-1">{item.text}</p>
                                <small className="text-muted">{item.date}</small>
                            </div>
                        </li>
                    ))}
                </ul>
                {activityData.length > 0 && (
                    <a href="#" className="d-flex align-items-center text-muted">
                        <FiMoreHorizontal className='fs-12' />
                        <span className="fs-10 text-uppercase ms-2 text-truncate-1-line">Load More</span>
                    </a>
                )}
            </div>
            <hr />
            <div className="logs-history mb-0">
                <div className="px-4 mb-4 d-flex justify-content-between">
                    <h5 className="fw-bold">Transaction History</h5>
                    <a href="#" className="btn btn-sm btn-light-brand">View All</a>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead className="text-dark text-center border-top">
                            <tr>
                                <th className="text-start ps-4">Browser/Device</th>
                                <th>IP Address</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-center">
                            {logData.map((log, index) => (
                                <LogEntry
                                    key={index}
                                    browser={log.browser}
                                    ip={log.ip}
                                    time={log.time}
                                    action={log.action}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default TabActivityContent




const LogEntry: React.FC<{ browser: string; ip: string; time: string; action: string }> = ({ browser, ip, time, action }) => {
    return (
        <tr>
            <td className="fw-medium text-dark text-start ps-4">{browser}</td>
            <td><span className="text-muted">{ip}</span></td>
            <td>
                <span className="text-muted">{time}</span>
            </td>
            <td>
                {action === 'success' ? (
                    <FiCheckCircle className='text-success' />
                ) : (
                    <FiX className='text-danger' />
                )}
            </td>
        </tr>
    );
};

