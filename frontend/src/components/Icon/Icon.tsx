import React from 'react'
import {
  MdDarkMode,
  MdLightMode,
  MdDriveFileRenameOutline,
  MdSave,
  MdDragIndicator,
  MdOutlineImage,
} from 'react-icons/md'
import { LuCirclePlus } from 'react-icons/lu'
import { LiaUndoAltSolid } from 'react-icons/lia'
import { FaArrowLeft, FaArrowRight, FaSave } from 'react-icons/fa'
import {
  FaAnglesUp,
  FaAnglesDown,
  FaAnglesLeft,
  FaAnglesRight,
} from 'react-icons/fa6'
import { GoArrowLeft, GoArrowRight } from 'react-icons/go'
import {
  BiReset,
  BiSolidColorFill,
  BiHide,
  BiShowAlt,
  BiLogInCircle,
} from 'react-icons/bi'
import {
  RiDeleteBin2Line,
  RiMailSendLine,
  RiQuestionLine,
} from 'react-icons/ri'
import { PiDownloadSimpleFill, PiImage } from 'react-icons/pi'
import { SiSvgtrace } from 'react-icons/si'
import { IoMdCheckmarkCircleOutline } from 'react-icons/io'
import { IoPerson } from 'react-icons/io5'
import { CgUndo } from 'react-icons/cg'
import { TiDeleteOutline } from 'react-icons/ti'
import { ImCancelCircle } from 'react-icons/im'
import { BsFillMoonStarsFill, BsFillSunFill } from 'react-icons/bs'

type Props = React.SVGProps<SVGSVGElement> & {
  lib: string
  name: string
}

const iconMap: Record<string, React.ComponentType<any>> = {
  BsFillMoonStarsFill,
  BsFillSunFill,
  MdDarkMode,
  MdLightMode,
  MdDriveFileRenameOutline,
  MdSave,
  MdDragIndicator,
  MdOutlineImage,
  LuCirclePlus,
  LiaUndoAltSolid,
  CgUndo,
  FaArrowLeft,
  FaArrowRight,
  FaSave,
  GoArrowLeft,
  GoArrowRight,
  FaAnglesUp,
  FaAnglesDown,
  FaAnglesLeft,
  FaAnglesRight,
  BiReset,
  BiSolidColorFill,
  BiHide,
  BiShowAlt,
  BiLogInCircle,
  RiDeleteBin2Line,
  RiMailSendLine,
  RiQuestionLine,
  PiImage,
  PiDownloadSimpleFill,
  IoMdCheckmarkCircleOutline,
  IoPerson,
  ImCancelCircle,
  SiSvgtrace,
  TiDeleteOutline,
}

export default function Icon({ name, ...rest }: Props) {
  const Cmp = iconMap[name]
  if (!Cmp) return null
  return <Cmp aria-hidden="true" focusable="false" {...rest} />
}
