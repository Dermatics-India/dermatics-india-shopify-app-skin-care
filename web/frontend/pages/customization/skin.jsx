import React from 'react'
import { Page } from '@shopify/polaris'

import { useTranslation } from 'react-i18next'
import { CustomizeWidget } from '../../components/customization';

const skin = () => {
  const { t } = useTranslation()
  return (
    <Page fullWidth>
      <CustomizeWidget type="skinCare" />
    </Page>
  )
}

export default skin
