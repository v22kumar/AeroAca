import type { CareerLadder } from "@/lib/content/schema";

/**
 * The career ladder behind the journey: what the target roles are called at each rung, what the market
 * pays at that rung according to public, crowd-sourced salary sites, and what evidence moves an engineer
 * up. Every number is a figure a public page showed when it was read, with the page and the month, so
 * the learner can check it. The spread between sources is real: samples are small, titles differ, some
 * figures are base pay and others total pay. None of it is a promise: this academy builds evidence,
 * and evidence is what employers pay for.
 */
export const careerLadder: CareerLadder = {
  asOf: "2026-11",
  disclaimer:
    "Public, self-reported figures from salary sites in India (Glassdoor, Indeed, AmbitionBox as quoted by others, PayScale, SalaryExpert, 6figr), read in November 2026, in lakhs per year. Samples are small, titles vary and some figures are base pay. They show what the market reports; they are not a promise of what any course delivers.",
  startingLevel: "level-1",
  levels: [
    {
      id: "level-1",
      title: "Level 1: Engineer",
      years: "2 to 4 years",
      roles: ["Avionics or systems integration engineer", "V&V or test engineer", "Embedded software engineer", "Hardware validation engineer"],
      band: { low: 7, high: 15 },
      evidence: [
        "Says exactly what she did on each project, at the right ownership level, and it holds up when probed.",
        "Explains the standards vocabulary of the work (software level, requirement, test case, traceability, bus words) from first principles.",
        "Has one debugging story with a measurement that decided it.",
      ],
      builtBy: "Stages 1 and 2 (modules 25, 17 and 18); the foundations in modules 1 to 16 where the diagnostic points.",
      sources: [
        { publisher: "Glassdoor (India)", what: "Avionics engineer, 27 reports, typical range 25th to 75th percentile", low: 5.05, high: 14, dated: "2026-05", url: "https://www.glassdoor.co.in/Salaries/avionics-engineer-salary-SRCH_KO0,17.htm" },
        { publisher: "Glassdoor (India)", what: "Systems integration engineer, median about 11, typical range", low: 6.3, high: 15.5, dated: "2026-06", url: "https://www.glassdoor.co.in/Salaries/systems-integration-engineer-salary-SRCH_KO0,28.htm" },
        { publisher: "AmbitionBox, as quoted by Brolly Academy", what: "Embedded software engineer, 1 to 5 years, about 12,500 reports", low: 7.2, high: 8, dated: "2026-10", url: "https://brollyacademy.com/embedded-engineer-salary-in-india/" },
        { publisher: "Glassdoor (India)", what: "Senior engineer at a large avionics supplier (Collins Aerospace), 25 reports", low: 9, high: 11, dated: "2026-10", url: "https://www.glassdoor.co.in/Salary/Collins-Aerospace-Salaries-E2375726.htm" },
        { publisher: "Indeed (India)", what: "Senior engineer at a large avionics supplier (Collins Aerospace), 14 postings, average", low: 10.1, dated: "2026-10", url: "https://in.indeed.com/cmp/Collins-Aerospace/salaries/Senior-Engineer" },
        { publisher: "Glassdoor (Bangalore)", what: "Senior engineer at an aerospace and controls company (Honeywell), typical range", low: 8, high: 11, dated: "2026-07", url: "https://www.glassdoor.co.in/Salary/Honeywell-Bangalore-Salaries-EI_IE28.0,9_IL.10,19_IM1091.htm" },
      ],
    },
    {
      id: "level-2",
      title: "Level 2: Senior or lead engineer",
      years: "4 to 8 years",
      roles: ["Senior systems or integration engineer", "Lead V&V engineer", "Senior embedded engineer", "Test automation lead", "HIL or bench lead"],
      band: { low: 14, high: 31 },
      evidence: [
        "Owns a component or a bench end to end: architecture drawn, interfaces specified, tests designed from requirements, results reported with coverage.",
        "Can answer 'is it schedulable?', 'what does the voter do on disagreement?' and 'what did you inject?' with numbers.",
        "States every metric with its method, and has corrected her own CV where a claim did not survive the audit.",
        "Has reviewed other people's test procedures and problem reports with independence.",
      ],
      builtBy: "Stages 3 to 6 (modules 19 to 24), the portfolio track, and module 25 for the claims.",
      sources: [
        { publisher: "Glassdoor (India)", what: "Lead engineer at a large avionics supplier (Collins Aerospace), 147 reports", low: 9, high: 14, dated: "2026-10", url: "https://www.glassdoor.co.in/Salary/Collins-Aerospace-Lead-Engineer-Salaries-E2375726_D_KO18,31.htm" },
        { publisher: "Glassdoor (India)", what: "Senior lead engineer at the same supplier, 126 reports", low: 14, high: 22, dated: "2026-10", url: "https://www.glassdoor.co.in/Salary/Collins-Aerospace-Senior-Lead-Engineer-Salaries-E2375726_D_KO18,38.htm" },
        { publisher: "Indeed (India)", what: "Senior lead engineer at the same supplier, 12 reports, average", low: 19.75, dated: "2026-10", url: "https://in.indeed.com/cmp/Collins-Aerospace/salaries" },
        { publisher: "Weekday (India)", what: "Technical lead at an aerospace and controls company (Honeywell), median", low: 20, dated: "2026-10", url: "https://www.weekday.works/salary/what-salary-does-honeywell-pay" },
        { publisher: "Glassdoor (India)", what: "Lead engineer at an aircraft manufacturer's Bangalore centre (Airbus), estimated range", low: 18, high: 31, dated: "2026-10", url: "https://www.glassdoor.co.in/Salary/Airbus-Engineer-Salaries-E3059_D_KO7,15.htm" },
        { publisher: "6figr (India)", what: "Engineer at an aircraft manufacturer's India centre (Boeing), 82 profiles, average about 20.4, most between", low: 13.8, high: 55, dated: "2026-10", url: "https://6figr.com/in/salary/boeing--engineer" },
        { publisher: "ERI SalaryExpert (India)", what: "Systems integration engineer with 8 or more years, average", low: 20.6, dated: "2026-08", url: "https://www.salaryexpert.com/salary/job/systems-integration-engineer/india" },
      ],
    },
    {
      id: "level-3",
      title: "Level 3: Principal engineer or architect",
      years: "8 to 15 years",
      roles: ["Principal systems or software engineer", "Avionics architect", "V&V lead for a programme", "Technical lead of a flight-control or mission-system team"],
      band: { low: 25, high: 37 },
      evidence: [
        "Decides architecture for a subsystem and can defend the trade-offs in a design review against the safety assessment.",
        "Owns the verification strategy of a programme: levels, coverage, tool qualification, change impact across baselines.",
        "Is the person other engineers bring the fault they cannot explain; has a record of root causes found and prevented.",
        "Mentors, reviews and sets the standard for evidence in the team.",
      ],
      builtBy: "Everything above, done repeatedly on real programmes, plus modules 26 to 31 for the depth; no course gets anyone here, work does.",
      sources: [
        { publisher: "Glassdoor (India)", what: "Principal engineer at a large avionics supplier (Collins Aerospace), typical range", low: 25, high: 37, dated: "2026-10", url: "https://www.glassdoor.co.in/Salary/Collins-Aerospace-Salaries-E2375726.htm" },
        { publisher: "Glassdoor (India)", what: "Principal engineer, all industries, average about 26.1, typical range", low: 17.5, high: 37.25, dated: "2026-10", url: "https://www.glassdoor.co.in/Salaries/principal-engineer-salary-SRCH_KO0,18.htm" },
        { publisher: "PayScale (India)", what: "Principal engineer, all industries, average base pay", low: 28.2, dated: "2026-10", url: "https://www.payscale.com/research/IN/Job=Principal_Engineer/Salary" },
        { publisher: "6figr (India)", what: "Principal engineer, all industries, median of reported total pay", low: 33.1, dated: "2026-10", url: "https://6figr.com/in/salary/principal-engineer--t" },
        { publisher: "6figr (India)", what: "Technical lead with about 11 years at an aircraft manufacturer's India centre (Boeing), one profile", low: 31.8, dated: "2026-10", url: "https://6figr.com/in/salary/the-boeing--bengaluru--cl" },
      ],
    },
    {
      id: "level-4",
      title: "Level 4: Chief engineer, technical fellow or engineering manager",
      years: "15 years and more",
      roles: ["Chief engineer of a product line", "Technical fellow or distinguished engineer", "Engineering manager or head of V&V"],
      band: { low: 47, high: 56 },
      evidence: [
        "Accountable for a product's technical integrity across its life: certification basis, architecture, suppliers, incidents.",
        "Sets direction for many teams and is judged on the outcomes of decisions made years earlier.",
        "Known outside the company: standards committees, conference talks, patents or published work.",
      ],
      builtBy: "Not built by any course. Listed so the ladder is complete and the numbers above it are visible; the data here is the thinnest.",
      sources: [
        { publisher: "6figr (India)", what: "Software engineer and team lead with about 13 years at an aircraft manufacturer's India centre (Boeing), one profile", low: 51.2, dated: "2026-10", url: "https://6figr.com/in/salary/the-boeing--bengaluru--cl" },
        { publisher: "Glassdoor (Bangalore)", what: "Engineering manager at the same centre, estimated average; the page's own figures disagree with each other", low: 56, dated: "2026-10", url: "https://www.glassdoor.com/Salary/Boeing-Engineering-Manager-Bangalore-Salaries-EJI_IE102.0,6_KO7,26_IL.27,36_IM1091.htm" },
        { publisher: "6figr (India)", what: "Top tenth of reported pay at the same centre, above", low: 46.7, dated: "2026-10", url: "https://6figr.com/in/salary/boeing--engineer" },
      ],
    },
  ],
};
