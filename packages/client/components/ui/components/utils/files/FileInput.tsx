import {
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  splitProps,
} from "solid-js";

import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { ALLOWED_IMAGE_TYPES } from "@revolt/state";
import { Button, Ripple } from "../../design";
import { Row } from "../../layout";
import { Symbol } from "../Symbol";

interface Props {
  /**
   * Currently selected file(s),
   * a URL for a preview,
   * or no file at all.
   */
  file: File[] | string | null;

  /**
   * Callback for selected file(s)
   *
   * Your consumer code should perform
   * additional validation such as file size.
   * @param files Selected File(s)
   */
  onFiles: (files: File[] | null) => void;

  /**
   * Whether to accept multiple files
   */
  multiple?: false;

  /**
   * What type of files to accept
   */
  accept?: "image/*";

  imageAspect?: string;
  imageRounded?: boolean;
  imageJustify?: boolean;
  allowRemoval?: boolean;

  required: boolean;
  disabled: boolean;

  /**
   * Threaded through to `process` as the single source of
   * truth, so a crop/resize/etc. step can validate its actual output
   * against the same number the caller already configured, instead of
   * the caller having to repeat the limit separately for the processor.
   */
  maxSize?: number;

  /**
   * Optional pipeline step between the native picker and `onFiles`.
   */
  process?: (
    files: File[],
    resolve: (files: File[] | null) => void,
    maxSize: number | undefined,
  ) => void;
}

/**
 * Form element for collecting files
 */
export function FileInput(props: Props) {
  const [local, remote] = splitProps(props, [
    "file",
    "onFiles",
    "multiple",
    "accept",
    "process",
    "maxSize",
  ]);
  let inputRef: HTMLInputElement | undefined;

  const [pendingProcess, setPendingProcess] = createSignal<File[] | null>(null);

  /**
   * Handle file selection
   */
  function onChange(e: Event & { currentTarget: HTMLInputElement }) {
    if (!e.currentTarget.files) return;
    if (!takeFiles([...e.currentTarget.files])) e.currentTarget.files = null;
  }

  /**
   * Ferret mod: shared by the file picker and drag and drop
   * (stoatchat/for-web#150). Returns false if the files were refused.
   */
  function takeFiles(files: File[]) {
    // If accept is an image, check all the files submitted if they match our accept values
    if (local.accept === "image/*") {
      for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          // If they were stubborn enough to disable our filter for files then just ignore the file.
          // No need for feedback, they know what they did.
          local.onFiles(null);
          return false;
        }
      }
    }

    const selected = local.multiple ? files : files.slice(0, 1);

    if (local.process) {
      setPendingProcess(selected);
      return true;
    }

    // NB. need to help out with the reactivity by
    //     first removing the array, and then setting
    //     the new one; otherwise no update! ¯\_(ツ)_/¯
    local.onFiles(null);
    local.onFiles(selected);
    return true;
  }

  // Ferret mod: drop an image straight onto the picture to upload it. The
  // events stop here, so the page doesn't also attach it to a message.
  const [dragging, setDragging] = createSignal(false);
  const hasFiles = (event: DragEvent) =>
    !!event.dataTransfer &&
    [...event.dataTransfer.items].some((item) => item.kind === "file");
  function onDragOver(event: DragEvent) {
    if (props.disabled || !hasFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = "copy";
    setDragging(true);
  }
  function onDragLeave() {
    setDragging(false);
  }
  function onDrop(event: DragEvent) {
    if (props.disabled || !event.dataTransfer?.files.length) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    takeFiles([...event.dataTransfer.files]);
  }

  function resolveProcess(result: File[] | null) {
    setPendingProcess(null);
    if (result) {
      local.onFiles(null);
      local.onFiles(result);
    }
  }

  /**
   * Handle clear
   */
  function onClear() {
    inputRef!.value = null!;
    local.onFiles(null);
  }

  function imageSrc() {
    if (typeof local.file === "string") {
      return local.file;
    } else if (Array.isArray(local.file)) {
      // purportedly, we don't need to revoke:
      // https://stackoverflow.com/a/49346614
      return URL.createObjectURL(local.file[0]);
    } else {
      return "";
    }
  }

  createEffect(() => {
    const filesToProcess = pendingProcess();
    if (local.process && filesToProcess) {
      local.process!(filesToProcess, resolveProcess, local.maxSize);
    }
  });

  return (
    <>
      <Switch
        fallback={
          <>
            <input ref={inputRef} type="file" onChange={onChange} {...remote} />
            <Show when={local.file?.length || 0 > 0}>
              <Button
                size="icon"
                variant="text"
                onPress={onClear}
                isDisabled={!props.file}
              >
                X
              </Button>
            </Show>
          </>
        }
      >
        <Match when={local.accept === "image/*"}>
          <input
            type="file"
            ref={inputRef}
            class={css({
              display: "none",
            })}
            onChange={onChange}
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            {...remote}
          />
          <Row align justify={props.imageJustify ?? true} gap="lg">
            <ImagePreview
              onClick={() => inputRef!.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              title="Click or drop an image here"
              style={{
                "aspect-ratio": props.imageAspect ?? "1/1",
                outline: dragging()
                  ? "2px dashed var(--md-sys-color-primary)"
                  : undefined,
                "outline-offset": "2px",
              }}
              rounded={props.imageRounded ?? true}
            >
              <Ripple />
              <Show when={local.file}>
                <img src={imageSrc()} />
              </Show>
            </ImagePreview>

            <Show when={props.allowRemoval !== false}>
              <Button
                size="icon"
                variant="text"
                onPress={onClear}
                isDisabled={!props.file}
              >
                <Symbol>close</Symbol>
              </Button>
            </Show>
          </Row>
        </Match>
      </Switch>
    </>
  );
}

const ImagePreview = styled("div", {
  base: {
    cursor: "pointer",
    position: "relative",
    height: "96px",

    backgroundColor: "var(--md-sys-color-surface-dim)",

    "& img": {
      display: "block",
      height: "100%",
      width: "100%",

      objectFit: "cover",
    },
  },
  variants: {
    rounded: {
      true: {
        borderRadius: "50%",

        "& img": {
          borderRadius: "50%",
        },
      },
      false: {
        borderRadius: "var(--borderRadius-lg)",

        "& img": {
          borderRadius: "var(--borderRadius-lg)",
        },
      },
    },
  },
});
