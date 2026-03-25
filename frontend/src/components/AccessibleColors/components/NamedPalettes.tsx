import { FC, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import styles from '../accessiblecolors.module.css'
import { useLanguageContext } from '../../../contexts/LanguageContext'
import { useConfirm } from '../../../contexts/ConfirmContext'
import { useAppDispatch } from '../../../hooks/useAppDispatch'
import { notify } from '../../../reducers/notificationReducer'
import { ReducerProps } from '../../../types'
import {
  deleteColorPaletteByUser,
  getAllColorPalettesByUser,
  getColorPaletteByUser,
  saveColorPaletteByUser,
  SavedColorPalette,
} from '../../../services/colors'
import { ColorBlock, TColorMode } from '../AccessibleColors'
import Accordion from '../../Accordion/Accordion'
import { sanitize } from '../../../utils'
import Icon from '../../Icon/Icon'
import FormLogin from '../../Login/Login'
import useLocalStorage from '../../../hooks/useStorage'

type Props = {
  colors: ColorBlock[]
  currentColor: string
  mode: TColorMode
  setColors: (value: ColorBlock[]) => void
  setCurrentColor: (value: string) => void
  setModeFromServer: (mode: TColorMode) => void
  updateUrlColors: (colors: ColorBlock[]) => void
  scrollRefCurrent: HTMLDivElement | null
  user: ReducerProps['auth']['user']
}

const NamedPalettes: FC<Props> = ({
  colors,
  currentColor,
  mode,
  setColors,
  setCurrentColor,
  setModeFromServer,
  updateUrlColors: _updateUrlColors,
  scrollRefCurrent,
  user,
}) => {
  const { language, t } = useLanguageContext()
  const confirm = useConfirm()
  const dispatch = useAppDispatch()

  const [palettes, setPalettes] = useState<SavedColorPalette[]>([])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState(false)

  const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(
    'itemsPerPage',
    3
  )
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPageId = useId()

  const [newName, setNewName] = useState('')
  const [editName, setEditName] = useState('')

  const hasSavedFiles = palettes.length > 0

  const isLoggedIn = Boolean(user?._id)

  const refreshList = useCallback(async () => {
    if (!user?._id) return
    setIsLoading(true)
    setServerError(false)
    try {
      const list = await getAllColorPalettesByUser(user._id, language)
      setPalettes(list)
    } catch (err) {
      console.error(err)
      setServerError(true)
    } finally {
      setIsLoading(false)
    }
  }, [language, user?._id])

  useEffect(() => {
    if (!isLoggedIn) return
    void refreshList()
  }, [isLoggedIn, refreshList])

  const handleSave = useCallback(async () => {
    if (!user?._id) return

    const versionName = name.trim()
    if (!versionName) {
      void dispatch(notify(t('NameIsRequired'), true, 5))
      return
    }
    if (versionName.length > 30) {
      void dispatch(notify('Name too long (max 30)', true, 5))
      return
    }

    const existsAlready = palettes.some((p) => p.versionName === versionName)
    if (existsAlready) {
      const ok = await confirm({
        message: `"${versionName}" ${t('AlreadyExists')}. ${t('OverwriteIt')}?`,
      })
      if (!ok) return
    }

    try {
      setBusy(true)
      await saveColorPaletteByUser(
        user._id,
        versionName,
        { colors, currentColor, mode },
        language
      )
      setName(versionName)
      void dispatch(notify(t('Saved'), false, 4))
      await refreshList()
    } catch (err) {
      console.error(err)
      void dispatch(notify(t('Error') ?? 'Error', true, 5))
    } finally {
      setBusy(false)
    }
  }, [
    colors,
    confirm,
    currentColor,
    dispatch,
    language,
    mode,
    name,
    palettes,
    refreshList,
    t,
    user?._id,
  ])

  const handleLoadByName = useCallback(
    async (versionName: string) => {
      if (!user?._id) return

      const ok = await confirm({
        message: t('NoteThatUnsavedChangesWillBeLost') as string,
      })
      if (!ok) return

      try {
        setBusy(true)
        const palette = await getColorPaletteByUser(
          user._id,
          versionName,
          language
        )

        if (!Array.isArray(palette.colors)) {
          void dispatch(notify(t('InvalidPaletteData'), true, 5))
          return
        }

        setColors(palette.colors)
        if (typeof palette.currentColor === 'string')
          setCurrentColor(palette.currentColor)
        if (typeof palette.mode === 'string')
          setModeFromServer(palette.mode as TColorMode)

        setName(versionName)
        void dispatch(notify(t('PaletteLoaded'), false, 4))
      } catch (err) {
        console.error(err)
        void dispatch(notify(t('Error'), true, 5))
      } finally {
        setBusy(false)
        scrollRefCurrent?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    },
    [
      confirm,
      dispatch,
      language,
      setColors,
      setCurrentColor,
      setModeFromServer,
      t,
      user?._id,
    ]
  )

  const handleDeleteByName = useCallback(
    async (versionName: string) => {
      if (!user?._id) return

      const ok = await confirm({
        message: (t('Delete') + ': ' + versionName) as string,
      })
      if (!ok) return

      try {
        setBusy(true)
        await deleteColorPaletteByUser(user._id, versionName, language)
        void dispatch(notify(t('Deleted'), false, 4))
        await refreshList()
      } catch (err) {
        console.error(err)
        void dispatch(notify(t('Error'), true, 5))
      } finally {
        setBusy(false)
      }
    },
    [confirm, dispatch, language, refreshList, t, user?._id]
  )

  const handleRenameByName = useCallback(
    async (versionName: string, nextVersionName: string) => {
      if (!user?._id) return

      const newVersion = nextVersionName.trim()

      if (newVersion === '') {
        void dispatch(notify(t('NameIsRequired'), true, 5))
        return
      }

      if (newVersion.length > 30) {
        void dispatch(notify(t('NameTooLong') + ' (max 30)', true, 5))
        return
      }

      if (newVersion === versionName) {
        void dispatch(notify(t('PleaseChooseDifferentName'), true, 5))
        return
      }

      const existsAlready = palettes.some((p) => p.versionName === newVersion)
      if (existsAlready) {
        const ok = await confirm({
          message: `"${newVersion}" ${t('AlreadyExists')}. ${t('OverwriteIt')}?`,
        })
        if (!ok) return
      }

      try {
        setBusy(true)
        const palette = await getColorPaletteByUser(
          user._id,
          versionName,
          language
        )
        await saveColorPaletteByUser(user._id, newVersion, palette, language)
        await deleteColorPaletteByUser(user._id, versionName, language)
        setEditName('')
        setNewName('')
        void dispatch(notify(t('Saved'), false, 4))
        await refreshList()
      } catch (err) {
        console.error(err)
        void dispatch(notify(t('Error'), true, 5))
      } finally {
        setBusy(false)
      }
    },
    [confirm, dispatch, language, palettes, refreshList, t, user?._id]
  )

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(palettes.length / itemsPerPage))
  }, [itemsPerPage, palettes.length])

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages))
  }, [totalPages])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const [loginOpen, setLoginOpen] = useState(false)

  const itemsPerPageDiv = () => {
    return (
      <div
        className={`${styles['pagination-controls']} ${styles['items-per-page-div']}`}
      >
        <div
          className={`input-wrap ${styles['input-wrap']} ${styles['items-per-page']}`}
        >
          <label htmlFor={itemsPerPageId}>
            <input
              id={itemsPerPageId}
              type="number"
              value={itemsPerPage}
              placeholder={itemsPerPage.toString()}
              min={1}
              max={100}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
            />
            <span>{t('PerPage')}</span>
          </label>
        </div>
      </div>
    )
  }
  const pagination = (current: number, totalPages: number) => {
    return hasSavedFiles ? (
      <div className={styles['pagination-controls']}>
        {current !== 1 ? (
          <>
            <button
              onClick={() => handlePageChange(1)}
              disabled={current === 1}
              className={`gray ${styles['btn-small']} ${styles['pagination-btn']}`}
              type="button"
            >
              &laquo;&nbsp;<span className="scr">{t('BackToStart')}</span>
            </button>
            <button
              onClick={() => handlePageChange(Math.max(current - 1, 1))}
              disabled={current === 1}
              className={`gray ${styles['btn-small']} ${styles['pagination-btn']}`}
              type="button"
            >
              &nbsp;&lsaquo;&nbsp;<span className="scr">{t('Previous')}</span>
            </button>
          </>
        ) : (
          <></>
        )}
        <span>
          {t('Page')} {current} / {totalPages}
        </span>
        {current !== totalPages ? (
          <>
            <button
              onClick={() =>
                handlePageChange(Math.min(current + 1, totalPages))
              }
              disabled={current === totalPages}
              className={`gray ${styles['btn-small']} ${styles['pagination-btn']}`}
              type="button"
            >
              <span className="scr">{t('Next')}</span>&nbsp;&rsaquo;&nbsp;
            </button>

            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={current === totalPages}
              className={`gray ${styles['btn-small']} ${styles['pagination-btn']}`}
              type="button"
            >
              <span className="scr">{t('ToLastPage')}</span>&nbsp;&raquo;
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    ) : (
      <></>
    )
  }

  if (!isLoggedIn)
    return (
      <section>
        <div className={`mt2 mb2 ${styles['login-wrap']}`}>
          <FormLogin
            isOpen={loginOpen}
            setIsFormOpen={setLoginOpen}
            showIcon
            text="gray"
          />
        </div>
      </section>
    )

  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const currentPalettes = palettes.slice(startIdx, endIdx)

  return (
    <div className={`${styles['accessiblecolors-palettes']}`}>
      <h2>{t('SaveColorPalette')}</h2>
      <div className={styles['color-handling']}>
        <div className="full wide flex column center gap">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
          >
            <div className={`input-wrap ${styles['input-wrap']}`}>
              <label htmlFor="color-palette-name">
                <input
                  id="color-palette-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('Name')}
                  maxLength={30}
                  disabled={busy}
                />
                <span>{t('Name')}:</span>
              </label>
            </div>
            <button className="gray tooltip-wrap" type="submit" disabled={busy}>
              {t('Save')} <Icon lib="fa" name="FaSave" aria-hidden="true" />
              <span className="tooltip below left narrow2">
                {t('SaveToDatabase')}
              </span>
            </button>
          </form>
        </div>

        <h3>{t('ColorPalettes')}</h3>
        {isLoading ? (
          <p>{t('Loading')}...</p>
        ) : serverError ? (
          <p>{t('ErrorConnectingToTheServer')}</p>
        ) : !hasSavedFiles ? (
          <p>{t('NoSavedPalettesYet')}</p>
        ) : (
          <div className="full flex center margin0auto">
            {itemsPerPageDiv()}
            {pagination(currentPage, totalPages)}
            <ul className={styles['color-versions-wrap']}>
              {currentPalettes.map((p, index) => (
                <li
                  key={`${p.versionName}+${index}`}
                  className={styles['color-version-item']}
                >
                  <span>{p.versionName}</span>
                  <div className={styles['button-wrap']}>
                    <button
                      className={`gray`}
                      type="button"
                      onClick={() => void handleLoadByName(p.versionName)}
                      disabled={busy}
                    >
                      {t('Load')} <span className="scr">{p.versionName}</span>{' '}
                      <Icon
                        lib="pi"
                        name="PiDownloadSimpleFill"
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      className={`gray`}
                      type="button"
                      onClick={() => void handleDeleteByName(p.versionName)}
                      disabled={busy}
                    >
                      {t('Delete')} <span className="scr">{p.versionName}</span>{' '}
                      <Icon
                        lib="ri"
                        name="RiDeleteBin2Line"
                        aria-hidden="true"
                      />
                    </button>
                    <Accordion
                      id={`accordion-palette-rename-${sanitize(p.versionName)}`}
                      className={`gray ${styles['colornewname']}`}
                      wrapperClass={`${styles['colornewname-wrap']} ${editName === p.versionName ? styles['open'] : styles['closed']}`}
                      text={
                        <>
                          {t('Rename')}{' '}
                          <Icon
                            lib="md"
                            name="MdDriveFileRenameOutline"
                            aria-hidden="true"
                          />
                        </>
                      }
                      hideBrackets={true}
                      setIsFormOpen={(open) => {
                        setEditName(open ? p.versionName : '')
                      }}
                      onClick={() => {
                        setNewName(p.versionName)
                        setEditName(p.versionName)
                      }}
                      isOpen={editName === p.versionName}
                    >
                      <>
                        <div className={`input-wrap ${styles['input-wrap']}`}>
                          <label
                            htmlFor={`palette-rename-${sanitize(p.versionName)}`}
                          >
                            <input
                              id={`palette-rename-${sanitize(p.versionName)}`}
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder={t('Rename')}
                              maxLength={30}
                              disabled={busy}
                            />
                            <span>{t('Rename')}:</span>{' '}
                            <span className="scr">{p.versionName}</span>
                          </label>
                        </div>
                        <div className="flex row center gap">
                          <button
                            className="gray mt-1"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void handleRenameByName(p.versionName, newName)
                            }
                          >
                            {t('Save')}{' '}
                            <Icon lib="md" name="MdSave" aria-hidden="true" />
                            <span className="scr">
                              {p.versionName}: {t('NewName')} {newName}
                            </span>
                          </button>
                          <button
                            className="gray mt-1"
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditName('')
                              setNewName('')
                            }}
                          >
                            {t('Cancel')}{' '}
                            <Icon
                              lib="im"
                              name="ImCancelCircle"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </>
                    </Accordion>
                  </div>
                </li>
              ))}
            </ul>
            {pagination(currentPage, totalPages)}
            {itemsPerPageDiv()}
          </div>
        )}
      </div>
    </div>
  )
}

export default NamedPalettes
