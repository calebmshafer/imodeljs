/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Text
 */

import * as React from "react";
import { StyledText } from "./StyledText";
import { TextProps } from "./TextProps";

/** Styled subheading text React functional component
 * @public
 */
export function Subheading2(props: TextProps) {
  return <StyledText {...props} mainClassName="uicore-text-subheading-2" />;
}
