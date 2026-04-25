namespace MyMvcProject.Models
{
    public class GroupSetting
    {
        public int Id { get; set; }
        public string Name { get; set; } = "Nhóm mới";
        public double Probability { get; set; } = 0;
        public string Color { get; set; } = "#6c757d"; // Màu mặc định (xám)
    }
}
