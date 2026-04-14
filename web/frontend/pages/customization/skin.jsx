import React from 'react'
import { Page } from '@shopify/polaris'

import { useTranslation } from 'react-i18next'
import { Customization } from '../../components/customization';

const skin = () => {
  const { t } = useTranslation()
  return (
    <Page fullWidth>
      <Customization type="skinCare" />
    </Page>
  )
}

export default skin
