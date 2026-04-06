import React from 'react'
import { Page } from '@shopify/polaris'
import { TitleBar } from '@shopify/app-bridge-react'
import { useTranslation } from 'react-i18next'

const skin = () => {
  const { t } = useTranslation()
  return (
    <Page narrowWidth>
        <TitleBar title={t("NavigationMenu.customization.skin")} />
        
    </Page>
  )
}

export default skin