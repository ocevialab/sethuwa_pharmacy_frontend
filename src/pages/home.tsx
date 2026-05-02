import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import Footer from '@/components/shared/Footer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import SummaryCards from '@/components/dashboard/SummaryCards'
import LowStockList from '@/components/dashboard/LowStockList'
import ExpiringMedicinesList from '@/components/dashboard/ExpiringMedicinesList'
import RecentSalesList from '@/components/dashboard/RecentSalesList'
import { useUserPermissions } from '@/hooks/useUserPermissions'

const Home = () => {
    const { hasModulePermission, loading } = useUserPermissions();

    return (
        <>
            <PageHeader />
            <div className='main-content'>
                <div className='row'>
                    <div className='col-12'>
                        <DashboardHeader />
                        {/* Only show SummaryCards if user has Finance permissions */}
                        {!loading && hasModulePermission("Finance") && <SummaryCards />}
                        {/* Only show LowStockList if user has Inventory permissions */}
                        {!loading && hasModulePermission("Inventory") && <LowStockList />}
                        {/* Only show ExpiringMedicinesList if user has Medicine permissions */}
                        {!loading && hasModulePermission("Medicine") && <ExpiringMedicinesList />}
                        {/* Only show RecentSalesList if user has Sales permissions */}
                        {!loading && hasModulePermission("Sales") && <RecentSalesList />}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Home