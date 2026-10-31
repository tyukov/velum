// Калькулятор стоимости в карточке товара.
// Считает по площади крыши или по размерам дома, с запасом по типу крыши; сравнивает покрытия
// на ту же площадь; для простых крыш — доборные элементы. Ввод запоминаем на время визита,
// чтобы при смене покрытия или цвета не вводить заново. Заявка и WhatsApp уходят с расчётом.
import {
  ROOF_TYPES,
  SLOPES,
  roofArea,
  screws,
  sheetArea,
  trims,
  type RoofType,
  type Slope,
} from "../lib/roof";

const SMALL_ORDER_M2 = 50;
const MAX_AREA = 100_000;
const MAX_SIDE = 500;
const STATE_KEY = "velum:calc";

interface Option {
  name: string;
  price: number;
  inStock: boolean;
  href: string;
  current: boolean;
}

interface State {
  mode: "area" | "house";
  area: string;
  length: string;
  width: string;
  slope: Slope;
  roof: RoofType;
}

/** 1050 → «1 050» с неразрывным пробелом */
const group = (n: number) => new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, "\u00a0");
const tenge = (n: number) => `${group(n)}\u00a0₸`;
const num = (v: string) => Number(v.replace(",", "."));
const fmt = (n: number) => String(n).replace(".", ",");

function loadState(): Partial<State> {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveState(state: State) {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Приватный режим: просто не запоминаем
  }
}

export function initCalc() {
  const calc = document.querySelector<HTMLElement>(".calc");
  if (!calc) return;
  const $ = <T extends Element = HTMLElement>(sel: string) => calc.querySelector<T>(sel)!;
  const radio = (name: string) =>
    calc.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)!.value;
  const setRadio = (name: string, value?: string) => {
    const el =
      value && calc.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    if (el) el.checked = true;
  };

  const price = Number(calc.dataset.price);
  const options: Option[] = JSON.parse(calc.dataset.options ?? "[]");
  const inputs = {
    area: $<HTMLInputElement>("#calc-area"),
    length: $<HTMLInputElement>("#calc-length"),
    width: $<HTMLInputElement>("#calc-width"),
  };
  const result = $(".calc__result");
  const productField = document.querySelector<HTMLInputElement>('#ex1 input[name="product"]');
  const baseProduct = productField?.value ?? "";
  const orderText = document.querySelector<HTMLElement>(".product-view__order .btn__text");
  const whatsapp = $<HTMLAnchorElement>(".calc__whatsapp");

  const saved = loadState();
  inputs.area.value = saved.area ?? "";
  inputs.length.value = saved.length ?? "";
  inputs.width.value = saved.width ?? "";
  setRadio("calc-mode", saved.mode);
  setRadio("calc-slope", saved.slope);
  setRadio("calc-roof", saved.roof);

  const error = $(".calc__error");
  const reset = (message = "") => {
    result.hidden = true;
    error.textContent = message;
    error.hidden = !message;
    if (productField) productField.value = baseProduct;
    if (orderText) orderText.textContent = "Узнать стоимость";
  };

  const update = () => {
    const state: State = {
      mode: radio("calc-mode") as State["mode"],
      area: inputs.area.value,
      length: inputs.length.value,
      width: inputs.width.value,
      slope: radio("calc-slope") as Slope,
      roof: radio("calc-roof") as RoofType,
    };
    saveState(state);
    calc.querySelectorAll<HTMLElement>(".calc__mode").forEach((el) => {
      el.hidden = el.dataset.mode !== state.mode;
    });

    // Площадь крыши: введена или посчитана по размерам дома
    let area: number;
    let source: string;
    const length = num(state.length);
    const width = num(state.width);
    if (state.mode === "area") {
      area = num(state.area);
      source = `крыша ${fmt(area)} м²`;
    } else {
      if (!state.length || !state.width) return reset();
      if (!(length >= 1 && length <= MAX_SIDE && width >= 1 && width <= MAX_SIDE))
        return reset(
          `Длина и ширина дома — от 1 до ${MAX_SIDE} м. Для больших объектов рассчитаем индивидуально.`,
        );
      area = roofArea(length, width, state.slope);
      source =
        `дом ${fmt(length)} × ${fmt(width)} м, ${SLOPES[state.slope].label.toLowerCase()} крыша ` +
        `(~${SLOPES[state.slope].degrees}°), скаты ≈ ${fmt(area)} м²`;
    }
    if (state.mode === "area" && !state.area) return reset();
    if (!(area >= 1 && area <= MAX_AREA))
      return reset(
        `Площадь — от 1 до ${group(MAX_AREA)} м². Для больших объектов рассчитаем индивидуально.`,
      );
    error.hidden = true;

    const roof = ROOF_TYPES[state.roof];
    const sheets = sheetArea(area, state.roof);
    const sum = sheets * price;
    result.hidden = false;
    $(".calc__sum").textContent = tenge(sum);
    $(".calc__detail").textContent =
      `${sheets} м² металлочерепицы: ${state.mode === "house" ? `площадь скатов ≈ ${fmt(area)} м² со свесами 0,5 м, ` : ""}` +
      `запас ${roof.reserve * 100}% на раскрой и нахлёсты (${roof.label.toLowerCase()} крыша), ` +
      `по ${tenge(price)} за м². Без доборных элементов и доставки.`;
    $(".calc__note").hidden = !("smallMarkup" in calc.dataset) || sheets >= SMALL_ORDER_M2;

    // Доборные элементы: только по размерам дома и для простых крыш
    const t = state.mode === "house" ? trims(length, width, state.roof, state.slope) : null;
    const trimsBox = $(".calc__trims");
    trimsBox.hidden = !t;
    const trimLines = t
      ? [
          t.ridge && `конёк — ${t.ridge} м`,
          `торцевая планка — ${t.gable} м`,
          `карнизная планка — ${t.eave} м`,
          `саморезы — ~${group(screws(sheets))} шт`,
        ].filter((x): x is string => Boolean(x))
      : [];
    $(".calc__trims-list").replaceChildren(
      ...trimLines.map((line) =>
        Object.assign(document.createElement("li"), { textContent: line }),
      ),
    );

    // Сравнение покрытий: от дешёвого к дорогому, текущее отмечено
    $(".calc__compare-list").replaceChildren(
      ...[...options]
        .sort((a, b) => a.price - b.price)
        .map((o) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = o.href;
          a.className = "calc__option";
          if (o.current) a.setAttribute("aria-current", "true");
          const name = Object.assign(document.createElement("span"), {
            className: "calc__option-name",
            textContent: o.name,
          });
          if (o.inStock)
            name.append(
              Object.assign(document.createElement("span"), {
                className: "calc__option-stock",
                textContent: "в наличии",
              }),
            );
          const cost = Object.assign(document.createElement("span"), {
            className: "calc__option-sum",
            textContent: tenge(sheets * o.price),
          });
          a.append(name, cost);
          li.append(a);
          return li;
        }),
    );

    const summary = `${source}, ${roof.label.toLowerCase()}; ${sheets} м² листа, примерно ${tenge(sum)}`;
    const trimsText = trimLines.length ? `; доборные: ${trimLines.join(", ")}` : "";
    if (productField) productField.value = `${baseProduct}; ${summary}${trimsText}`;
    if (orderText) orderText.textContent = "Получить точный расчёт";
    const message =
      `Здравствуйте! Расчёт с сайта velum.kz:\n${baseProduct}\n${summary}${trimsText}\n` +
      `Подскажите точную стоимость с доставкой.`;
    whatsapp.href = `https://wa.me/${calc.dataset.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  calc.addEventListener("input", update);
  calc.addEventListener("change", update);
  update();
}
