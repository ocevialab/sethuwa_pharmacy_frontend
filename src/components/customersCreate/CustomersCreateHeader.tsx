import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const CustomersCreateHeader = () => {
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('id');
    const isEditMode = !!customerId;

    return (
        <div className="d-flex align-items-center gap-2 page-header-right-items-wrapper">
            <Link to="/customers/list" className="btn btn-light-brand">
                <span>Back to List</span>
            </Link>
        </div>
    )
}

export default CustomersCreateHeader