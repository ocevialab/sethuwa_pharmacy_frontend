import React from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import GlossaryCreateHeader from '@/components/glossaryCreate/GlossaryCreateHeader'
import GlossaryForm from '@/components/glossary/GlossaryForm'
import Footer from '@/components/shared/Footer'

const GlossaryCreate = () => {
    return (
        <>
            <PageHeader>
                <GlossaryCreateHeader />
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <GlossaryForm />
                </div>
            </div>
            <Footer />
        </>
    )
}

export default GlossaryCreate;

