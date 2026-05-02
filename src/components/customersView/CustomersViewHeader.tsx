import React from 'react'
import { FiEdit3, FiPlus } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'

const CustomersViewHeader = () => {
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('id');

    return (
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link to="/customers/list" className="btn btn-light-brand">
                <span>Back to List</span>
            </Link>
            {customerId && (
                <Link to={`/customers/create?id=${customerId}`} className="btn btn-primary">
                    <FiEdit3 size={16} className='me-2' />
                    <span>Edit Customer</span>
                </Link>
            )}
            <Link to="/customers/create" className="btn btn-primary">
                <FiPlus size={16} className='me-2' />
                <span>Create Customer</span>
            </Link>
        </div>
    )
}

export default CustomersViewHeader