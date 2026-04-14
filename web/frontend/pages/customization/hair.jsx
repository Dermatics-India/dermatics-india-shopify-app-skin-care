import React, { useEffect } from 'react'
import { Page } from '@shopify/polaris'
import { useTranslation } from 'react-i18next'
import { Customization } from '../../components/customization';

const hair = () => {
    const { t } = useTranslation();
    
    return (
        <Page fullWidth>
            <Customization type="hairCare" />
        </Page>
    )
}

export default hair