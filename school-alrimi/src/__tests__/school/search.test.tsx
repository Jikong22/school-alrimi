import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SchoolSearch } from "@/components/school/SchoolSearch";
import { SchoolResults } from "@/components/school/SchoolResults";
import { SchoolCard } from "@/components/school/SchoolCard";
import { useSchoolSelection } from "@/hooks/useSchoolSelection";
import * as schoolSearchModule from "@/lib/neis/school-search";

// Mock the server action
vi.mock("@/lib/neis/school-search", () => ({
  searchSchools: vi.fn(),
}));

const mockSchools = [
  {
    schoolName: "서초고등학교",
    schoolCode: "7010087",
    region: "서울특별시교육청",
    schoolKind: "고등학교",
  },
  {
    schoolName: "서초중학교",
    schoolCode: "7010088",
    region: "서울특별시교육청",
    schoolKind: "중학교",
  },
];

describe("School Search UI", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<SchoolSearch onResults={() => {}} />);
    expect(
      screen.getByPlaceholderText("학교 이름을 입력하세요 (예: 서초)")
    ).toBeInTheDocument();
  });

  it("debounces search by 300ms", async () => {
    const mockSearch = vi.mocked(schoolSearchModule.searchSchools);
    mockSearch.mockResolvedValue(mockSchools);

    const onResults = vi.fn();
    render(<SchoolSearch onResults={onResults} />);

    const input = screen.getByPlaceholderText("학교 이름을 입력하세요 (예: 서초)");
    fireEvent.change(input, { target: { value: "서초" } });

    // Immediately after typing, search should not have been called
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance 300ms
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith("서초");
    });
  });

  it("does not search with less than 2 characters", async () => {
    const mockSearch = vi.mocked(schoolSearchModule.searchSchools);
    mockSearch.mockResolvedValue([]);

    const onResults = vi.fn();
    render(<SchoolSearch onResults={onResults} />);

    const input = screen.getByPlaceholderText("학교 이름을 입력하세요 (예: 서초)");
    fireEvent.change(input, { target: { value: "서" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearch).not.toHaveBeenCalled();
    });
  });

  it("displays search results", () => {
    const onSelect = vi.fn();
    render(<SchoolResults schools={mockSchools} onSelect={onSelect} />);

    expect(screen.getByText("서초고등학교")).toBeInTheDocument();
    expect(screen.getByText("서초중학교")).toBeInTheDocument();
  });

  it("shows empty state when no results", () => {
    render(<SchoolResults schools={[]} onSelect={() => {}} />);
    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });

  it("selects school on card click", () => {
    const onSelect = vi.fn();
    render(
      <SchoolCard
        schoolName="서초고등학교"
        schoolCode="7010087"
        region="서울특별시교육청"
        schoolKind="고등학교"
        onClick={() => onSelect(mockSchools[0])}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /서초고등학교 선택/ }));
    expect(onSelect).toHaveBeenCalledWith(mockSchools[0]);
  });

  it("persists selected school to localStorage", async () => {
    const TestComponent = () => {
      const { selectedSchool, selectSchool, clearSchool } = useSchoolSelection();
      return (
        <div>
          <div data-testid="school">
            {selectedSchool ? selectedSchool.schoolName : "none"}
          </div>
          <button onClick={() => selectSchool(mockSchools[0])}>select</button>
          <button onClick={clearSchool}>clear</button>
        </div>
      );
    };

    render(<TestComponent />);

    // Initially empty
    expect(screen.getByTestId("school").textContent).toBe("none");

    // Select school
    fireEvent.click(screen.getByText("select"));

    await waitFor(() => {
      expect(screen.getByTestId("school").textContent).toBe("서초고등학교");
    });

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem("selected-school")!);
    expect(stored.schoolCode).toBe("7010087");

    // Clear
    fireEvent.click(screen.getByText("clear"));

    await waitFor(() => {
      expect(screen.getByTestId("school").textContent).toBe("none");
    });

    expect(localStorage.getItem("selected-school")).toBeNull();
  });

  it("loads selected school from localStorage on mount", async () => {
    localStorage.setItem("selected-school", JSON.stringify(mockSchools[0]));

    const TestComponent = () => {
      const { selectedSchool, isLoaded } = useSchoolSelection();
      if (!isLoaded) return <div>loading</div>;
      return <div data-testid="school">{selectedSchool ? selectedSchool.schoolName : "none"}</div>;
    };

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("school").textContent).toBe("서초고등학교");
    });
  });
});
